import type { Currency, FxQuote } from "./types";

const ratesKey = "wb-fx-rates";
const lastRefreshKey = "wb-fx-last-refresh";
const cacheWindowMs = 6 * 60 * 60 * 1000;

export type StoredFxQuote = FxQuote & {
  readonly updatedAt: string;
};

export type StoredFxRates = Partial<Record<Currency, StoredFxQuote>>;

const isStoredFxQuote = (value: unknown): value is StoredFxQuote => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "currency" in value &&
    (value.currency === "KRW" || value.currency === "USD") &&
    "quote" in value &&
    value.quote === "KRW" &&
    "rate" in value &&
    Number.isFinite(Number(value.rate)) &&
    "date" in value &&
    typeof value.date === "string" &&
    "source" in value &&
    typeof value.source === "string" &&
    "updatedAt" in value &&
    typeof value.updatedAt === "string"
  );
};

const readProperty = (value: object, key: Currency): unknown => {
  if (!(key in value)) {
    return undefined;
  }
  return Object.getOwnPropertyDescriptor(value, key)?.value;
};

export const loadStoredFxRates = (): StoredFxRates => {
  const raw = window.localStorage.getItem(ratesKey);
  if (raw === null) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null) {
    return {};
  }
  const rates: StoredFxRates = {};
  for (const currency of ["KRW", "USD"] as const) {
    const candidate = readProperty(parsed, currency);
    if (isStoredFxQuote(candidate)) {
      rates[currency] = candidate;
    }
  }
  return rates;
};

export const isFxCacheFresh = (): boolean => {
  const lastRefresh = window.localStorage.getItem(lastRefreshKey);
  return lastRefresh !== null && Date.now() - new Date(lastRefresh).getTime() < cacheWindowMs;
};

export const saveStoredFxRates = (rates: StoredFxRates) => {
  window.localStorage.setItem(ratesKey, JSON.stringify(rates));
  window.localStorage.setItem(lastRefreshKey, new Date().toISOString());
};
