import type { Currency, MarketHistory, MarketHistoryItem, MarketQuote, MarketRange, NewsItem, NewsResult, SymbolCode } from "./types";

type MarketItem = {
  readonly date?: unknown;
  readonly open?: unknown;
  readonly high?: unknown;
  readonly low?: unknown;
  readonly close?: unknown;
  readonly volume?: unknown;
};

type MarketResponse = {
  readonly source?: unknown;
  readonly currency?: unknown;
  readonly code?: unknown;
  readonly items?: readonly MarketItem[];
};

type NewsItemResponse = {
  readonly title?: unknown;
  readonly link?: unknown;
  readonly publisher?: unknown;
  readonly publishedAt?: unknown;
};

type NewsResponse = {
  readonly source?: unknown;
  readonly items?: readonly NewsItemResponse[];
};

const isCurrency = (value: unknown): value is Currency => value === "KRW" || value === "USD";

const parseMarketItem = (item: MarketItem): MarketHistoryItem | null => {
  const date = typeof item.date === "string" ? item.date : "";
  const open = Number(item.open);
  const high = Number(item.high);
  const low = Number(item.low);
  const close = Number(item.close);
  const volume = Number(item.volume);
  if (!date || !Number.isFinite(close)) {
    return null;
  }
  return {
    date,
    open: Number.isFinite(open) ? open : close,
    high: Number.isFinite(high) ? high : close,
    low: Number.isFinite(low) ? low : close,
    close,
    volume: Number.isFinite(volume) ? volume : 0,
  };
};

const latestPriceItem = (items: readonly MarketItem[] | undefined): { date: string; close: number } | null => {
  let latest: { date: string; close: number } | null = null;
  for (const item of items ?? []) {
    const price = Number(item.close);
    if (typeof item.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
        !Number.isFinite(Date.parse(item.date)) || !Number.isFinite(price) || price <= 0) continue;
    if (latest === null || item.date > latest.date) latest = { date: item.date, close: price };
  }
  return latest;
};

export const fetchMarketHistory = async (symbol: SymbolCode, range: MarketRange): Promise<MarketHistory> => {
  const response = await fetch(`/api/market?code=${encodeURIComponent(symbol)}&range=${range}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("시세를 찾을 수 없습니다.");
  }

  const data: MarketResponse = await response.json();
  const currency = isCurrency(data.currency) ? data.currency : /^\d{6}$/.test(symbol) ? "KRW" : "USD";
  const items = data.items?.map(parseMarketItem).filter((item): item is MarketHistoryItem => item !== null) ?? [];
  if (items.length === 0) {
    throw new Error("시세 응답이 비어 있습니다.");
  }

  return {
    source: typeof data.source === "string" ? data.source : "외부 시세",
    currency,
    code: typeof data.code === "string" ? data.code : symbol.toUpperCase(),
    items,
  };
};

export const fetchMarketQuote = async (symbol: SymbolCode): Promise<MarketQuote> => {
  const response = await fetch(`/api/market?code=${encodeURIComponent(symbol)}&range=1w`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("시세를 찾을 수 없습니다.");
  }

  const data: MarketResponse = await response.json();
  const latest = latestPriceItem(data.items);
  const currency = isCurrency(data.currency) ? data.currency : /^\d{6}$/.test(symbol) ? "KRW" : "USD";
  if (latest === null) {
    throw new Error("시세 응답이 비어 있습니다.");
  }

  return {
    symbol: typeof data.code === "string" ? data.code : symbol.toUpperCase(),
    price: latest.close,
    currency,
    updatedAt: latest.date,
    source: typeof data.source === "string" ? data.source : "외부 시세",
  };
};

export const fetchNews = async (query: string): Promise<NewsResult> => {
  const response = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("뉴스를 찾을 수 없습니다.");
  }

  const data: NewsResponse = await response.json();
  const items: readonly NewsItem[] =
    data.items
      ?.map((item) => ({
        title: typeof item.title === "string" ? item.title : "",
        link: typeof item.link === "string" ? item.link : "",
        publisher: typeof item.publisher === "string" ? item.publisher : "",
        publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : "",
      }))
      .filter((item) => item.title.length > 0 && item.link.length > 0) ?? [];

  return {
    source: typeof data.source === "string" ? data.source : "Google News",
    items,
  };
};
