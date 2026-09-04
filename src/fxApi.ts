import type { Currency, FxQuote } from "./types";

type FxResponse = {
  readonly source?: unknown;
  readonly currency?: unknown;
  readonly quote?: unknown;
  readonly rate?: unknown;
  readonly date?: unknown;
};

const isCurrency = (value: unknown): value is Currency => value === "KRW" || value === "USD";

export const fetchFxQuote = async (currency: Currency): Promise<FxQuote> => {
  const response = await fetch(`/api/fx?currency=${encodeURIComponent(currency)}`);
  if (!response.ok) {
    throw new Error("환율을 찾을 수 없습니다.");
  }

  const data: FxResponse = await response.json();
  const rate = Number(data.rate);
  if (!Number.isFinite(rate) || !isCurrency(data.currency) || data.quote !== "KRW") {
    throw new Error("환율 응답이 올바르지 않습니다.");
  }

  return {
    source: typeof data.source === "string" ? data.source : "외부 환율",
    currency: data.currency,
    quote: "KRW",
    rate,
    date: typeof data.date === "string" ? data.date : new Date().toISOString().slice(0, 10),
  };
};
