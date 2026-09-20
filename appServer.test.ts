import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";
import { appServerPlugin } from "./appServer";
import { marketServerPlugin } from "./marketServer";

describe("app server", () => {
  let directory = "";
  let server: ViteDevServer | null = null;

  afterEach(async () => {
    await server?.close();
    if (directory.length > 0) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("stores a portfolio only for the authenticated user", async () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-api-"));
    server = await createServer({
      configFile: false,
      logLevel: "silent",
      plugins: [appServerPlugin({ databasePath: join(directory, "test.sqlite") }), marketServerPlugin()],
      server: { host: "127.0.0.1", port: 0 },
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (address === null || typeof address === "string" || address === undefined) {
      throw new Error("test server did not expose a TCP address");
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const credentials = { email: "first@example.com", password: "password123" };

    // When
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const cookie = registerResponse.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
    const portfolio = { accounts: [], instruments: [], targets: [], holdings: [], cashPositions: [] };
    const saveResponse = await fetch(`${baseUrl}/api/portfolio`, {
      method: "PUT",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(portfolio),
    });
    const secondCredentials = { email: "second@example.com", password: "password123" };
    const secondRegisterResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(secondCredentials),
    });
    const secondCookie = secondRegisterResponse.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
    const secondPortfolio = {
      accounts: [{ id: "second", name: "second", broker: "test" }],
      instruments: [],
      targets: [],
      holdings: [],
      cashPositions: [],
    };
    await fetch(`${baseUrl}/api/portfolio`, {
      method: "PUT",
      headers: { cookie: secondCookie, "content-type": "application/json" },
      body: JSON.stringify(secondPortfolio),
    });
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, { headers: { cookie } });
    const secondSessionResponse = await fetch(`${baseUrl}/api/auth/session`, { headers: { cookie: secondCookie } });
    const fxResponse = await fetch(`${baseUrl}/api/fx?currency=KRW`);

    // Then
    expect(registerResponse.status).toBe(201);
    expect(saveResponse.status).toBe(204);
    expect(await sessionResponse.json()).toEqual({ user: { email: credentials.email }, portfolio });
    expect(await secondSessionResponse.json()).toEqual({
      user: { email: secondCredentials.email },
      portfolio: secondPortfolio,
    });
    expect(fxResponse.status).toBe(200);
    expect((await fetch(`${baseUrl}/api/auth/session`)).status).toBe(401);
  });

  it("throttles repeated authentication attempts", async () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-api-"));
    server = await createServer({
      configFile: false,
      logLevel: "silent",
      plugins: [appServerPlugin({ databasePath: join(directory, "test.sqlite") })],
      server: { host: "127.0.0.1", port: 0 },
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (address === null || typeof address === "string" || address === undefined) {
      throw new Error("test server did not expose a TCP address");
    }
    const endpoint = `http://127.0.0.1:${address.port}/api/auth/login`;

    // When
    const responses = await Promise.all(
      Array.from({ length: 11 }, () =>
        fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "missing@example.com", password: "wrong-password" }),
        }),
      ),
    );

    // Then
    expect(responses.filter((response) => response.status === 429).length).toBeGreaterThan(0);
  });

  it("resets a password with a code sent to the registered email", async () => {
    // Given
    directory = mkdtempSync(join(tmpdir(), "rebalance-api-"));
    let deliveredCode = "";
    let failDelivery = true;
    server = await createServer({
      configFile: false,
      logLevel: "silent",
      plugins: [
        appServerPlugin({
          databasePath: join(directory, "test.sqlite"),
          sendPasswordResetCode: async (_email, code) => {
            if (failDelivery) {
              throw new Error("delivery failed");
            }
            deliveredCode = code;
          },
        }),
      ],
      server: { host: "127.0.0.1", port: 0 },
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (address === null || typeof address === "string" || address === undefined) {
      throw new Error("test server did not expose a TCP address");
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const email = "reset@example.com";
    const oldPassword = "password123";
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: oldPassword }),
    });

    // When
    const failedRequestResponse = await fetch(`${baseUrl}/api/auth/password-reset/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    failDelivery = false;
    const requestResponse = await fetch(`${baseUrl}/api/auth/password-reset/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const verifyResponse = await fetch(`${baseUrl}/api/auth/password-reset/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code: deliveredCode }),
    });
    const verifyBody = await verifyResponse.json();
    const resetToken = typeof verifyBody === "object" && verifyBody !== null && "resetToken" in verifyBody
      ? verifyBody.resetToken
      : null;
    const completeResponse = await fetch(`${baseUrl}/api/auth/password-reset/complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resetToken, password: "new-password123" }),
    });
    const oldLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: oldPassword }),
    });
    const newLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "new-password123" }),
    });

    // Then
    expect(failedRequestResponse.status).toBe(502);
    expect(requestResponse.status).toBe(202);
    expect(deliveredCode).toMatch(/^\d{6}$/);
    expect(verifyResponse.status).toBe(200);
    expect(typeof resetToken).toBe("string");
    expect(completeResponse.status).toBe(204);
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });
});
