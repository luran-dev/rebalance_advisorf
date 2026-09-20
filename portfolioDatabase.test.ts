import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PortfolioDatabase } from "./portfolioDatabase";
import type { PortfolioState } from "./src/accountState";

const emptyPortfolio = (accountName: string): PortfolioState => ({
  accounts: [{ id: accountName, name: accountName, broker: "test" }],
  instruments: [],
  targets: [],
  holdings: [],
  cashPositions: [],
});

describe("PortfolioDatabase", () => {
  let directory = "";
  let database: PortfolioDatabase | null = null;

  afterEach(() => {
    database?.close();
    if (directory.length > 0) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("authenticates a registered user when the password matches", () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-store-"));
    database = new PortfolioDatabase(join(directory, "test.sqlite"));
    const user = database.register({ email: "USER@example.com", password: "password123" });

    // When
    const authenticated = database.authenticate({ email: "user@example.com", password: "password123" });

    // Then
    expect(authenticated).toEqual(user);
    expect(database.authenticate({ email: "user@example.com", password: "wrong-password" })).toBeNull();
  });

  it("keeps each user's portfolio isolated", () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-store-"));
    database = new PortfolioDatabase(join(directory, "test.sqlite"));
    const first = database.register({ email: "first@example.com", password: "password123" });
    const second = database.register({ email: "second@example.com", password: "password123" });

    // When
    database.writePortfolio(first.id, emptyPortfolio("first-account"));
    database.writePortfolio(second.id, emptyPortfolio("second-account"));

    // Then
    expect(database.readPortfolio(first.id)).toEqual(emptyPortfolio("first-account"));
    expect(database.readPortfolio(second.id)).toEqual(emptyPortfolio("second-account"));
  });

  it("resolves and revokes an authenticated session", () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-store-"));
    database = new PortfolioDatabase(join(directory, "test.sqlite"));
    const user = database.register({ email: "user@example.com", password: "password123" });
    const token = database.createSession(user.id);

    // When
    const sessionUser = database.userForSession(token);

    // Then
    expect(sessionUser).toEqual(user);
    database.deleteSession(token);
    expect(database.userForSession(token)).toBeNull();
  });

  it("resets a password once and revokes existing sessions", () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-store-"));
    database = new PortfolioDatabase(join(directory, "test.sqlite"));
    const user = database.register({ email: "user@example.com", password: "password123" });
    const session = database.createSession(user.id);

    // When
    const issued = database.issuePasswordReset("user@example.com", "123456");
    const grant = database.verifyPasswordReset("user@example.com", "123456");
    const reset = grant === null ? false : database.resetPassword(grant, "new-password123");

    // Then
    expect(issued).toBe(true);
    expect(grant).not.toBeNull();
    expect(reset).toBe(true);
    expect(database.authenticate({ email: "user@example.com", password: "password123" })).toBeNull();
    expect(database.authenticate({ email: "user@example.com", password: "new-password123" })).toEqual(user);
    expect(database.userForSession(session)).toBeNull();
    expect(grant === null ? false : database.resetPassword(grant, "another-password123")).toBe(false);
    expect(database.issuePasswordReset("missing@example.com", "654321")).toBe(false);
  });

  it("rejects a reset code after five failed attempts", () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-store-"));
    database = new PortfolioDatabase(join(directory, "test.sqlite"));
    database.register({ email: "user@example.com", password: "password123" });
    database.issuePasswordReset("user@example.com", "123456");

    // When
    for (let attempt = 0; attempt < 5; attempt += 1) {
      database.verifyPasswordReset("user@example.com", "000000");
    }

    // Then
    expect(database.verifyPasswordReset("user@example.com", "123456")).toBeNull();
  });

  it("rejects an expired reset code", () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-store-"));
    const filePath = join(directory, "test.sqlite");
    database = new PortfolioDatabase(filePath);
    database.register({ email: "user@example.com", password: "password123" });
    database.issuePasswordReset("user@example.com", "123456");
    const rawDatabase = new DatabaseSync(filePath);
    rawDatabase.prepare("UPDATE password_reset_codes SET expires_at = ?").run("2000-01-01T00:00:00.000Z");
    rawDatabase.close();

    // When
    const grant = database.verifyPasswordReset("user@example.com", "123456");

    // Then
    expect(grant).toBeNull();
  });
});
