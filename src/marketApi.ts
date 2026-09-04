import type { Currency, MarketQuote, SymbolCode } from "./types";

type MarketItem = {
  readonly date?: unknown;
  readonly close?: unknown;
};

type MarketResponse = {
  readonly source?: unknown;
  readonly currency?: unknown;
  readonly code?: unknown;
  readonly items?: readonly MarketItem[];
};

const isCurrency = (value: unknown): value is Currency => value === "KRW" || value === "USD";

const latestPriceItem = (items: readonly MarketItem[] | undefined): MarketItem | null =>
  items?.filter((item) => Number.isFinite(Number(item.close))).at(-1) ?? null;

export const fetchMarketQuote = async (symbol: SymbolCode): Promise<MarketQuote> => {
  const response = await fetch(`/api/market?code=${encodeURIComponent(symbol)}&range=6m`);
  if (!response.ok) {
    throw new Error("시세를 찾을 수 없습니다.");
  }

  const data: MarketResponse = await response.json();
  const latest = latestPriceItem(data.items);
  const currency = isCurrency(data.currency) ? data.currency : /^\d{6}$/.test(symbol) ? "KRW" : "USD";
  const price = Number(latest?.close);
  const updatedAt = typeof latest?.date === "string" ? latest.date : new Date().toISOString().slice(0, 10);

  if (!Number.isFinite(price)) {
    throw new Error("시세 응답이 비어 있습니다.");
  }

  return {
    symbol: typeof data.code === "string" ? data.code : symbol.toUpperCase(),
    price,
    currency,
    updatedAt,
    source: typeof data.source === "string" ? data.source : "외부 시세",
  };
};
