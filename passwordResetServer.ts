import { randomInt } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import ky from "ky";
import { z } from "zod";
import type { PortfolioDatabase } from "./portfolioDatabase";
import { RateLimiter, readJson, RequestError, sendJson } from "./serverHttp";

export type SendPasswordResetCode = (email: string, code: string) => Promise<void>;

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });
const verifySchema = emailSchema.extend({ code: z.string().regex(/^\d{6}$/) });
const completeSchema = z.object({
  resetToken: z.string().min(32).max(128),
  password: z.string().min(8).max(128),
});

export const passwordResetPaths = new Set([
  "/auth/password-reset/request",
  "/auth/password-reset/verify",
  "/auth/password-reset/complete",
]);

export const createResendPasswordResetSender = (
  apiKey: string | undefined,
  fromEmail: string | undefined,
): SendPasswordResetCode | null => {
  if (apiKey === undefined || fromEmail === undefined || apiKey.length === 0 || fromEmail.length === 0) {
    return null;
  }
  return async (email, code) => {
    await ky.post("https://api.resend.com/emails", {
      headers: { authorization: `Bearer ${apiKey}` },
      json: {
        from: fromEmail,
        to: [email],
        subject: "Rebalance Advisor 비밀번호 재설정 코드",
        text: `비밀번호 재설정 코드는 ${code}입니다. 이 코드는 5분 동안 한 번만 사용할 수 있습니다.`,
      },
      retry: 0,
      timeout: 10_000,
    });
  };
};

export const handlePasswordResetRequest = async ({
  request,
  response,
  database,
  rateLimiter,
  sendCode,
}: {
  readonly request: IncomingMessage;
  readonly response: ServerResponse;
  readonly database: PortfolioDatabase;
  readonly rateLimiter: RateLimiter;
  readonly sendCode: SendPasswordResetCode | null;
}): Promise<void> => {
  const path = new URL(request.url ?? "/", "http://localhost").pathname;
  if (request.method !== "POST") {
    sendJson(response, 404, { error: "요청한 API를 찾을 수 없습니다." });
    return;
  }
  const clientKey = `reset:${path}:ip:${request.socket.remoteAddress ?? "unknown"}`;
  if (!rateLimiter.consume(clientKey)) {
    throw new RequestError(429, "요청이 너무 많습니다. 5분 후 다시 시도해주세요.");
  }
  if (path === "/auth/password-reset/request") {
    if (sendCode === null) {
      throw new RequestError(503, "이메일 전송 설정이 필요합니다.");
    }
    const parsed = emailSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new RequestError(400, "이메일 형식을 확인해주세요.");
    }
    const emailKey = `reset-email:${parsed.data.email}`;
    if (!rateLimiter.consume(emailKey, 5)) {
      throw new RequestError(429, "요청이 너무 많습니다. 5분 후 다시 시도해주세요.");
    }
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    if (database.issuePasswordReset(parsed.data.email, code)) {
      try {
        await sendCode(parsed.data.email, code);
      } catch (error) {
        database.revokePasswordReset(parsed.data.email);
        if (error instanceof Error) {
          console.error(`Password reset email delivery failed: ${error.message}`);
          throw new RequestError(502, "인증 코드 이메일을 전송하지 못했습니다. 잠시 후 다시 시도해주세요.");
        } else {
          throw error;
        }
      }
    }
    sendJson(response, 202, { message: "가입된 이메일이면 인증 코드를 발송했습니다." });
    return;
  }
  if (path === "/auth/password-reset/verify") {
    const parsed = verifySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new RequestError(400, "이메일과 6자리 인증 코드를 확인해주세요.");
    }
    const resetToken = database.verifyPasswordReset(parsed.data.email, parsed.data.code);
    if (resetToken === null) {
      throw new RequestError(400, "인증 코드가 올바르지 않거나 만료되었습니다.");
    }
    sendJson(response, 200, { resetToken });
    return;
  }
  const parsed = completeSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    throw new RequestError(400, "새 비밀번호는 8자 이상이어야 합니다.");
  }
  if (!database.resetPassword(parsed.data.resetToken, parsed.data.password)) {
    throw new RequestError(400, "비밀번호 변경 요청이 만료되었습니다. 다시 시도해주세요.");
  }
  response.writeHead(204, { "cache-control": "no-store" });
  response.end();
};
