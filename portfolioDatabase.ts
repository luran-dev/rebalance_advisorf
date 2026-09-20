import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import type { PortfolioState } from "./src/accountState";
import { parsePortfolioBackup } from "./src/portfolioBackup";

export type AuthCredentials = {
  readonly email: string;
  readonly password: string;
};

export type User = {
  readonly id: string;
  readonly email: string;
};

const userSchema = z.object({ id: z.string().uuid(), email: z.string().email() });
const passwordUserSchema = userSchema.extend({
  password_hash: z.string().length(128),
  password_salt: z.string().min(16),
});
const passwordResetSchema = z.object({
  user_id: z.string().uuid(),
  code_hash: z.string().length(128),
  code_salt: z.string().min(16),
  attempts_remaining: z.number().int().positive(),
});
const passwordResetGrantSchema = z.object({ user_id: z.string().uuid() });

const normalizedEmail = (email: string): string => email.trim().toLowerCase();
const passwordHash = (password: string, salt: string): string => scryptSync(password, salt, 64).toString("hex");
const tokenHash = (token: string): string => createHash("sha256").update(token).digest("hex");

export class DuplicateEmailError extends Error {
  readonly name = "DuplicateEmailError";
}

export class PortfolioDatabase {
  readonly #database: DatabaseSync;

  constructor(filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.#database = new DatabaseSync(filePath);
    chmodSync(filePath, 0o600);
    this.#database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS portfolios (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        code_hash TEXT NOT NULL,
        code_salt TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        attempts_remaining INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS password_reset_grants (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL
      );
    `);
  }

  register(credentials: AuthCredentials): User {
    const email = normalizedEmail(credentials.email);
    if (this.#database.prepare("SELECT 1 FROM users WHERE email = ?").get(email) !== undefined) {
      throw new DuplicateEmailError("이미 가입된 이메일입니다.");
    }
    const user = { id: randomUUID(), email };
    const salt = randomBytes(16).toString("hex");
    this.#database
      .prepare("INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(user.id, user.email, passwordHash(credentials.password, salt), salt, new Date().toISOString());
    return user;
  }

  authenticate(credentials: AuthCredentials): User | null {
    const parsed = passwordUserSchema.safeParse(
      this.#database
        .prepare("SELECT id, email, password_hash, password_salt FROM users WHERE email = ?")
        .get(normalizedEmail(credentials.email)),
    );
    if (!parsed.success) {
      return null;
    }
    const actual = Buffer.from(parsed.data.password_hash, "hex");
    const supplied = Buffer.from(passwordHash(credentials.password, parsed.data.password_salt), "hex");
    return timingSafeEqual(actual, supplied) ? { id: parsed.data.id, email: parsed.data.email } : null;
  }

  createSession(userId: string): string {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.#database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
      tokenHash(token),
      userId,
      expiresAt,
    );
    return token;
  }

  userForSession(token: string): User | null {
    this.#database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
    const parsed = userSchema.safeParse(
      this.#database
        .prepare(
          "SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
        )
        .get(tokenHash(token), new Date().toISOString()),
    );
    return parsed.success ? parsed.data : null;
  }

  deleteSession(token: string): void {
    this.#database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
  }

  issuePasswordReset(email: string, code: string): boolean {
    const parsed = z.object({ id: z.string().uuid() }).safeParse(
      this.#database.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail(email)),
    );
    if (!parsed.success) {
      return false;
    }
    const salt = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    this.#database.prepare("DELETE FROM password_reset_grants WHERE user_id = ?").run(parsed.data.id);
    this.#database
      .prepare(
        "INSERT INTO password_reset_codes (user_id, code_hash, code_salt, expires_at, attempts_remaining) VALUES (?, ?, ?, ?, 5) ON CONFLICT(user_id) DO UPDATE SET code_hash = excluded.code_hash, code_salt = excluded.code_salt, expires_at = excluded.expires_at, attempts_remaining = 5",
      )
      .run(parsed.data.id, passwordHash(code, salt), salt, expiresAt);
    return true;
  }

  revokePasswordReset(email: string): void {
    this.#database
      .prepare("DELETE FROM password_reset_codes WHERE user_id = (SELECT id FROM users WHERE email = ?)")
      .run(normalizedEmail(email));
  }

  verifyPasswordReset(email: string, code: string): string | null {
    const now = new Date().toISOString();
    this.#database.prepare("DELETE FROM password_reset_codes WHERE expires_at <= ?").run(now);
    this.#database.prepare("DELETE FROM password_reset_grants WHERE expires_at <= ?").run(now);
    const parsed = passwordResetSchema.safeParse(
      this.#database
        .prepare(
          "SELECT password_reset_codes.user_id, code_hash, code_salt, attempts_remaining FROM password_reset_codes JOIN users ON users.id = password_reset_codes.user_id WHERE users.email = ?",
        )
        .get(normalizedEmail(email)),
    );
    if (!parsed.success) {
      return null;
    }
    const expected = Buffer.from(parsed.data.code_hash, "hex");
    const supplied = Buffer.from(passwordHash(code, parsed.data.code_salt), "hex");
    if (!timingSafeEqual(expected, supplied)) {
      if (parsed.data.attempts_remaining === 1) {
        this.#database.prepare("DELETE FROM password_reset_codes WHERE user_id = ?").run(parsed.data.user_id);
      } else {
        this.#database
          .prepare("UPDATE password_reset_codes SET attempts_remaining = attempts_remaining - 1 WHERE user_id = ?")
          .run(parsed.data.user_id);
      }
      return null;
    }
    const grant = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.prepare("DELETE FROM password_reset_codes WHERE user_id = ?").run(parsed.data.user_id);
      this.#database
        .prepare(
          "INSERT INTO password_reset_grants (token_hash, user_id, expires_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET token_hash = excluded.token_hash, expires_at = excluded.expires_at",
        )
        .run(tokenHash(grant), parsed.data.user_id, expiresAt);
      this.#database.exec("COMMIT");
      return grant;
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  resetPassword(grant: string, password: string): boolean {
    const now = new Date().toISOString();
    this.#database.prepare("DELETE FROM password_reset_grants WHERE expires_at <= ?").run(now);
    const parsed = passwordResetGrantSchema.safeParse(
      this.#database
        .prepare("SELECT user_id FROM password_reset_grants WHERE token_hash = ? AND expires_at > ?")
        .get(tokenHash(grant), now),
    );
    if (!parsed.success) {
      return false;
    }
    const salt = randomBytes(16).toString("hex");
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database
        .prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?")
        .run(passwordHash(password, salt), salt, parsed.data.user_id);
      this.#database.prepare("DELETE FROM password_reset_grants WHERE user_id = ?").run(parsed.data.user_id);
      this.#database.prepare("DELETE FROM sessions WHERE user_id = ?").run(parsed.data.user_id);
      this.#database.exec("COMMIT");
      return true;
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  writePortfolio(userId: string, portfolio: PortfolioState): void {
    this.#database
      .prepare(
        "INSERT INTO portfolios (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      )
      .run(userId, JSON.stringify(portfolio), new Date().toISOString());
  }

  readPortfolio(userId: string): PortfolioState | null {
    const row = z
      .object({ data: z.string() })
      .safeParse(this.#database.prepare("SELECT data FROM portfolios WHERE user_id = ?").get(userId));
    return row.success
      ? parsePortfolioBackup(JSON.stringify({ schemaVersion: 1, portfolio: JSON.parse(row.data.data) }))
      : null;
  }

  close(): void {
    this.#database.close();
  }
}
