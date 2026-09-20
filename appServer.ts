import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import type { Connect, Plugin } from "vite";
import { z } from "zod";
import { DuplicateEmailError, PortfolioDatabase, type User } from "./portfolioDatabase";
import {
  createResendPasswordResetSender,
  handlePasswordResetRequest,
  passwordResetPaths,
  type SendPasswordResetCode,
} from "./passwordResetServer";
import { RateLimiter, readJson, RequestError, sendJson } from "./serverHttp";
import { parsePortfolioBackup } from "./src/portfolioBackup";

const sessionCookie = "rebalance_session";
const appApiPaths = new Set([
  "/auth/session",
  "/auth/register",
  "/auth/login",
  "/auth/logout",
  "/portfolio",
  ...passwordResetPaths,
]);
const authSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

type ServerContext = {
  readonly database: PortfolioDatabase;
  readonly authRateLimiter: RateLimiter;
  readonly sendPasswordResetCode: SendPasswordResetCode | null;
};

const sendEmpty = (response: ServerResponse, status: number, cookie?: string): void => {
  response.writeHead(status, cookie === undefined ? {} : { "set-cookie": cookie });
  response.end();
};

const tokenFrom = (request: IncomingMessage): string | null => {
  const pair = request.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${sessionCookie}=`));
  return pair?.slice(sessionCookie.length + 1) ?? null;
};

const cookieFor = (token: string): string =>
  `${sessionCookie}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
const expiredCookie = `${sessionCookie}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;

const authenticatedUser = (
  request: IncomingMessage,
  response: ServerResponse,
  database: PortfolioDatabase,
): User | null => {
  const token = tokenFrom(request);
  const user = token === null ? null : database.userForSession(token);
  if (user === null) {
    sendJson(response, 401, { error: "로그인이 필요합니다." });
  }
  return user;
};

const handleRequest = async (
  request: IncomingMessage,
  response: ServerResponse,
  context: ServerContext,
): Promise<void> => {
  const { database, authRateLimiter, sendPasswordResetCode } = context;
  const path = new URL(request.url ?? "/", "http://localhost").pathname;
  if (passwordResetPaths.has(path)) {
    await handlePasswordResetRequest({
      request,
      response,
      database,
      rateLimiter: authRateLimiter,
      sendCode: sendPasswordResetCode,
    });
    return;
  }
  if (path === "/auth/session" && request.method === "GET") {
    const user = authenticatedUser(request, response, database);
    if (user !== null) {
      sendJson(response, 200, { user: { email: user.email }, portfolio: database.readPortfolio(user.id) });
    }
    return;
  }
  if ((path === "/auth/register" || path === "/auth/login") && request.method === "POST") {
    const clientKey = `ip:${request.socket.remoteAddress ?? "unknown"}`;
    if (!authRateLimiter.consume(clientKey)) {
      throw new RequestError(429, "로그인 시도가 너무 많습니다. 5분 후 다시 시도해주세요.");
    }
    const credentials = authSchema.safeParse(await readJson(request));
    if (!credentials.success) {
      throw new RequestError(400, "이메일 형식과 8자 이상 비밀번호를 확인해주세요.");
    }
    const accountKey = `email:${credentials.data.email}`;
    if (!authRateLimiter.consume(accountKey)) {
      throw new RequestError(429, "로그인 시도가 너무 많습니다. 5분 후 다시 시도해주세요.");
    }
    const user = path === "/auth/register" ? database.register(credentials.data) : database.authenticate(credentials.data);
    if (user === null) {
      throw new RequestError(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    if (path === "/auth/login") {
      authRateLimiter.reset(clientKey);
      authRateLimiter.reset(accountKey);
    }
    const token = database.createSession(user.id);
    response.setHeader("set-cookie", cookieFor(token));
    sendJson(response, path === "/auth/register" ? 201 : 200, {
      user: { email: user.email },
      portfolio: database.readPortfolio(user.id),
    });
    return;
  }
  if (path === "/auth/logout" && request.method === "POST") {
    const token = tokenFrom(request);
    if (token !== null) {
      database.deleteSession(token);
    }
    sendEmpty(response, 204, expiredCookie);
    return;
  }
  if (path === "/portfolio" && request.method === "PUT") {
    const user = authenticatedUser(request, response, database);
    if (user !== null) {
      const portfolio = parsePortfolioBackup(
        JSON.stringify({ schemaVersion: 1, portfolio: await readJson(request) }),
      );
      database.writePortfolio(user.id, portfolio);
      sendEmpty(response, 204);
    }
    return;
  }
  sendJson(response, 404, { error: "요청한 API를 찾을 수 없습니다." });
};

export const appServerPlugin = (options?: {
  readonly databasePath?: string | undefined;
  readonly resendApiKey?: string | undefined;
  readonly resendFromEmail?: string | undefined;
  readonly sendPasswordResetCode?: SendPasswordResetCode;
}): Plugin => {
  let database: PortfolioDatabase | null = null;
  const authRateLimiter = new RateLimiter();
  const sendPasswordResetCode =
    options?.sendPasswordResetCode ??
    createResendPasswordResetSender(options?.resendApiKey, options?.resendFromEmail);
  const getDatabase = (): PortfolioDatabase => {
    database ??= new PortfolioDatabase(
      options?.databasePath ?? process.env["REBALANCE_DB_PATH"] ?? join(process.cwd(), ".data", "rebalance-advisor.sqlite"),
    );
    return database;
  };
  const mount = (middlewares: Connect.Server): void => {
    middlewares.use("/api", (request, response, next) => {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      if (!appApiPaths.has(path)) {
        next();
        return;
      }
      handleRequest(request, response, { database: getDatabase(), authRateLimiter, sendPasswordResetCode }).catch((error: unknown) => {
        if (error instanceof DuplicateEmailError) {
          sendJson(response, 409, { error: error.message });
          return;
        }
        if (error instanceof RequestError) {
          sendJson(response, error.status, { error: error.message });
          return;
        }
        sendJson(response, 500, { error: "서버에서 요청을 처리하지 못했습니다." });
      });
    });
  };
  const closeDatabase = (): void => {
    database?.close();
    database = null;
  };

  return {
    name: "rebalance-advisor-app-server",
    configureServer(server) {
      mount(server.middlewares);
      server.httpServer?.once("close", closeDatabase);
    },
    configurePreviewServer(server) {
      mount(server.middlewares);
      server.httpServer?.once("close", closeDatabase);
    },
  };
};
