import ky, { HTTPError } from "ky";
import { z } from "zod";
import type { PortfolioState } from "./accountState";
import { parsePortfolioBackup } from "./portfolioBackup";

const api = ky.create({ prefix: "/api/", credentials: "same-origin", retry: 0, timeout: 10_000 });
const envelopeSchema = z.object({
  user: z.object({ email: z.string().email() }),
  portfolio: z.unknown().nullable(),
});
const errorSchema = z.object({ error: z.string() });
const resetTokenSchema = z.object({ resetToken: z.string().min(32) });

export type Credentials = {
  readonly email: string;
  readonly password: string;
};

export type AuthSession = {
  readonly email: string;
  readonly portfolio: PortfolioState | null;
};

export class ApiError extends Error {
  readonly name = "ApiError";
}

const parseSession = (value: unknown): AuthSession => {
  const envelope = envelopeSchema.parse(value);
  return {
    email: envelope.user.email,
    portfolio:
      envelope.portfolio === null
        ? null
        : parsePortfolioBackup(JSON.stringify({ schemaVersion: 1, portfolio: envelope.portfolio })),
  };
};

const messageFrom = (error: HTTPError): string => {
  const parsed = errorSchema.safeParse(error.data);
  return parsed.success ? parsed.data.error : "요청을 처리하지 못했습니다.";
};

const authenticate = async (path: "auth/login" | "auth/register", credentials: Credentials): Promise<AuthSession> => {
  try {
    return parseSession(await api.post(path, { json: credentials }).json<unknown>());
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new ApiError(messageFrom(error));
    }
    throw error;
  }
};

export const loadSession = async (): Promise<AuthSession | null> => {
  try {
    return parseSession(await api.get("auth/session").json<unknown>());
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 401) {
      return null;
    }
    throw error;
  }
};

export const login = (credentials: Credentials): Promise<AuthSession> => authenticate("auth/login", credentials);
export const register = (credentials: Credentials): Promise<AuthSession> => authenticate("auth/register", credentials);
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post("auth/password-reset/request", { json: { email } });
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new ApiError(messageFrom(error));
    }
    throw error;
  }
};
export const verifyPasswordReset = async (email: string, code: string): Promise<string> => {
  try {
    return resetTokenSchema.parse(
      await api.post("auth/password-reset/verify", { json: { email, code } }).json<unknown>(),
    ).resetToken;
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new ApiError(messageFrom(error));
    }
    throw error;
  }
};
export const completePasswordReset = async (resetToken: string, password: string): Promise<void> => {
  try {
    await api.post("auth/password-reset/complete", { json: { resetToken, password } });
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new ApiError(messageFrom(error));
    }
    throw error;
  }
};
export const logout = async (): Promise<void> => {
  await api.post("auth/logout", { json: {} });
};
export const savePortfolioState = async (portfolio: PortfolioState): Promise<void> => {
  await api.put("portfolio", { json: portfolio });
};
