import type { Plugin } from "vite";

type RangeKey = "1w" | "3m" | "6m" | "1y";

type NasdaqRow = {
  readonly date?: unknown;
  readonly open?: unknown;
  readonly high?: unknown;
  readonly low?: unknown;
  readonly close?: unknown;
  readonly volume?: unknown;
};

type NasdaqResponse = {
  readonly status?: { readonly rCode?: unknown };
  readonly data?: { readonly tradesTable?: { readonly rows?: readonly NasdaqRow[] } };
};

type MarketResponseWriter = {
  readonly writeHead: (status: number, headers: Record<string, string>) => void;
  readonly end: (body: string) => void;
};

const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const sendJson = (response: MarketResponseWriter, status: number, value: unknown) => {
  response.writeHead(status, {
    "cache-control": "no-store, no-cache, must-revalidate",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
};

const yyyymmdd = (date: Date): string =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

const yyyyDashMmDd = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const mmddyyyy = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match === null ? value : `${match[3]}-${match[1]}-${match[2]}`;
};

const moneyNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value !== "string") {
    return 0;
  }
  return Number(value.replace(/[$,]/g, ""));
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }
  return response.text();
};

const fetchJson = async (url: string, headers: Record<string, string>): Promise<NasdaqResponse> => {
  const response = await fetch(url, { headers: { ...headers, "user-agent": userAgent } });
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }
  return response.json();
};

const handleFx = async (requestUrl: string | undefined, response: MarketResponseWriter) => {
  const url = new URL(requestUrl ?? "", "http://localhost");
  const currency = (url.searchParams.get("currency") ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    sendJson(response, 400, { error: "invalid_currency" });
    return;
  }
  if (currency === "KRW") {
    sendJson(response, 200, {
      source: "KRW",
      currency: "KRW",
      quote: "KRW",
      rate: 1,
      date: new Date().toISOString().slice(0, 10),
    });
    return;
  }

  try {
    const text = await fetchText("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml");
    const date = text.match(/<Cube time=['"]([^'"]+)['"]/)?.[1] ?? "";
    const rates = new Map(
      [...text.matchAll(/<Cube currency=['"]([A-Z]{3})['"] rate=['"]([\d.]+)['"]\/>/g)].map((match) => [
        match[1] ?? "",
        Number(match[2]),
      ]),
    );
    const krwRate = rates.get("KRW");
    const currencyRate = currency === "EUR" ? 1 : rates.get(currency);
    if (krwRate === undefined || currencyRate === undefined) {
      sendJson(response, 404, { error: "currency_not_supported", currency });
      return;
    }
    sendJson(response, 200, {
      source: "ECB reference rate",
      currency,
      quote: "KRW",
      rate: Math.round((krwRate / currencyRate) * 1_000_000) / 1_000_000,
      date,
    });
  } catch (error) {
    sendJson(response, 502, { error: error instanceof Error ? error.message : "fx_request_failed" });
  }
};

const handleDomesticMarket = async (response: MarketResponseWriter, symbol: string, startDate: Date, endDate: Date) => {
  const marketUrl = `https://m.stock.naver.com/front-api/external/chart/domestic/info?symbol=${symbol}&requestType=1&startTime=${yyyymmdd(startDate)}&endTime=${yyyymmdd(endDate)}&timeframe=day`;
  const text = await fetchText(marketUrl);
  const items = [...text.matchAll(/\["(?<date>\d{8})",\s*(?<open>[\d.]+),\s*(?<high>[\d.]+),\s*(?<low>[\d.]+),\s*(?<close>[\d.]+),\s*(?<volume>[\d.]+)/g)].map((match) => ({
    date: `${match.groups?.date.slice(0, 4)}-${match.groups?.date.slice(4, 6)}-${match.groups?.date.slice(6, 8)}`,
    open: Number(match.groups?.open),
    high: Number(match.groups?.high),
    low: Number(match.groups?.low),
    close: Number(match.groups?.close),
    volume: Number(match.groups?.volume),
  }));
  sendJson(response, 200, { source: "NAVER Finance", currency: "KRW", code: symbol, items });
};

const handleOverseasMarket = async (response: MarketResponseWriter, symbol: string, startDate: Date) => {
  for (const assetClass of ["stocks", "etf"] as const) {
    const marketUrl = `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/historical?assetclass=${assetClass}&fromdate=${yyyyDashMmDd(startDate)}&limit=5000`;
    const data = await fetchJson(marketUrl, { Accept: "application/json", Origin: "https://www.nasdaq.com" });
    const rows = data.data?.tradesTable?.rows?.filter((row) => row.date !== undefined && row.close !== undefined) ?? [];

    if (data.status?.rCode === 200 && rows.length > 0) {
      const items = rows
        .map((row) => ({
          date: mmddyyyy(row.date),
          open: moneyNumber(row.open),
          high: moneyNumber(row.high),
          low: moneyNumber(row.low),
          close: moneyNumber(row.close),
          volume: moneyNumber(row.volume),
        }))
        .sort((left, right) => left.date.localeCompare(right.date));
      sendJson(response, 200, { source: assetClass === "etf" ? "Nasdaq ETF" : "Nasdaq", currency: "USD", code: symbol, items });
      return;
    }
  }
  sendJson(response, 404, { error: "symbol_not_found", code: symbol });
};

const handleMarket = async (requestUrl: string | undefined, response: MarketResponseWriter) => {
  const url = new URL(requestUrl ?? "", "http://localhost");
  const symbol = (url.searchParams.get("code") ?? "").trim();
  if (!/^[A-Za-z0-9.-]{1,20}$/.test(symbol)) {
    sendJson(response, 400, { error: "invalid_code" });
    return;
  }

  const range = url.searchParams.get("range");
  const daysByRange: Readonly<Record<RangeKey, number>> = { "1w": 10, "3m": 100, "6m": 190, "1y": 375 };
  const days = range === "1w" || range === "3m" || range === "6m" || range === "1y" ? daysByRange[range] : 40;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 86400000);

  try {
    if (/^\d{6}$/.test(symbol)) {
      await handleDomesticMarket(response, symbol, startDate, endDate);
      return;
    }
    await handleOverseasMarket(response, symbol.toUpperCase(), startDate);
  } catch (error) {
    sendJson(response, 502, { error: error instanceof Error ? error.message : "market_request_failed" });
  }
};

export const marketServerPlugin = (): Plugin => ({
  name: "rebalance-advisor-market-server",
  configureServer(server) {
    server.middlewares.use("/api/fx", (request, response) => {
      const requestUrl = "url" in request && typeof request.url === "string" ? request.url : undefined;
      void handleFx(requestUrl, response);
    });
    server.middlewares.use("/api/market", (request, response) => {
      const requestUrl = "url" in request && typeof request.url === "string" ? request.url : undefined;
      void handleMarket(requestUrl, response);
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use("/api/fx", (request, response) => {
      const requestUrl = "url" in request && typeof request.url === "string" ? request.url : undefined;
      void handleFx(requestUrl, response);
    });
    server.middlewares.use("/api/market", (request, response) => {
      const requestUrl = "url" in request && typeof request.url === "string" ? request.url : undefined;
      void handleMarket(requestUrl, response);
    });
  },
});
