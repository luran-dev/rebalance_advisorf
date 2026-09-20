import type { IncomingMessage, ServerResponse } from "node:http";

export class RequestError extends Error {
  readonly name = "RequestError";

  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export class RateLimiter {
  readonly #attempts = new Map<string, { readonly count: number; readonly resetAt: number }>();

  consume(key: string, limit = 10): boolean {
    const now = Date.now();
    const attempt = this.#attempts.get(key);
    if (attempt === undefined || attempt.resetAt <= now) {
      this.#attempts.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
      return true;
    }
    if (attempt.count >= limit) {
      return false;
    }
    this.#attempts.set(key, { ...attempt, count: attempt.count + 1 });
    return true;
  }

  reset(key: string): void {
    this.#attempts.delete(key);
  }
}

export const sendJson = (response: ServerResponse, status: number, value: unknown): void => {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
};

export const readJson = async (request: IncomingMessage): Promise<unknown> => {
  if (!request.headers["content-type"]?.startsWith("application/json")) {
    throw new RequestError(415, "JSON 요청만 지원합니다.");
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;
    if (size > 2_000_000) {
      throw new RequestError(413, "요청 데이터가 너무 큽니다.");
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new RequestError(400, "JSON 형식이 올바르지 않습니다.");
    }
    throw error;
  }
};
