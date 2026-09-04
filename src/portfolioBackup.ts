import type { PortfolioState } from "./accountState";
import {
  countryOptions,
  instrumentCategories,
  suitabilityOptions,
  type Account,
  type CashPosition,
  type Country,
  type Currency,
  type Holding,
  type Instrument,
  type InstrumentCategory,
  type Suitability,
  type TargetAsset,
} from "./types";

const storageKey = "rebalance-advisor-portfolio";
const schemaVersion = 1;

export type PortfolioBackup = {
  readonly schemaVersion: 1;
  readonly exportedAt: string;
  readonly portfolio: PortfolioState;
};

class PortfolioBackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioBackupError";
  }
}

const read = (value: object, key: string): unknown => Object.getOwnPropertyDescriptor(value, key)?.value;
const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;
const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isCurrency = (value: unknown): value is Currency => value === "KRW" || value === "USD";
const isSuitability = (value: unknown): value is Suitability | "-" =>
  value === "-" || suitabilityOptions.find((option) => option === value) !== undefined;
const isCategory = (value: unknown): value is InstrumentCategory =>
  instrumentCategories.find((category) => category === value) !== undefined;
const isCountry = (value: unknown): value is Country => countryOptions.find((country) => country === value) !== undefined;

const optionalString = (value: unknown): string | undefined => (isString(value) ? value : undefined);
const optionalNumber = (value: unknown): number | undefined => (isNumber(value) ? value : undefined);

const accountFrom = (value: unknown): Account | null => {
  if (!isObject(value)) {
    return null;
  }
  const id = read(value, "id");
  const name = read(value, "name");
  const broker = read(value, "broker");
  if (!isString(id) || !isString(name) || !isString(broker)) {
    return null;
  }
  const defaultFx = optionalNumber(read(value, "defaultFx"));
  return defaultFx === undefined ? { id, name, broker } : { id, name, broker, defaultFx };
};

const instrumentFrom = (value: unknown): Instrument | null => {
  if (!isObject(value)) {
    return null;
  }
  const name = read(value, "name");
  const symbol = read(value, "symbol");
  const country = read(value, "country");
  const currency = read(value, "currency");
  const category = read(value, "category");
  if (!isString(name) || !isString(symbol) || !isCountry(country) || !isCurrency(currency) || !isCategory(category)) {
    return null;
  }
  const price = optionalNumber(read(value, "price"));
  const priceUpdatedAt = optionalString(read(value, "priceUpdatedAt"));
  const priceSource = optionalString(read(value, "priceSource"));
  const fxRate = optionalNumber(read(value, "fxRate"));
  const fxUpdatedAt = optionalString(read(value, "fxUpdatedAt"));
  const fxSource = optionalString(read(value, "fxSource"));
  return {
    name,
    symbol,
    country,
    currency,
    category,
    ...(price === undefined ? {} : { price }),
    ...(priceUpdatedAt === undefined ? {} : { priceUpdatedAt }),
    ...(priceSource === undefined ? {} : { priceSource }),
    ...(fxRate === undefined ? {} : { fxRate }),
    ...(fxUpdatedAt === undefined ? {} : { fxUpdatedAt }),
    ...(fxSource === undefined ? {} : { fxSource }),
  };
};

const targetFrom = (value: unknown): TargetAsset | null => {
  if (!isObject(value)) {
    return null;
  }
  const accountId = read(value, "accountId");
  const assetClass = read(value, "assetClass");
  const symbol = read(value, "symbol");
  const productName = read(value, "productName");
  const suitability = read(value, "suitability");
  const targetPercent = read(value, "targetPercent");
  if (
    !isString(accountId) ||
    !isString(assetClass) ||
    !isString(symbol) ||
    !isString(productName) ||
    !isSuitability(suitability) ||
    suitability === "-" ||
    !isNumber(targetPercent)
  ) {
    return null;
  }
  return { accountId, assetClass, symbol, productName, suitability, targetPercent };
};

const holdingFrom = (value: unknown): Holding | null => {
  if (!isObject(value)) {
    return null;
  }
  const accountId = read(value, "accountId");
  const assetClass = read(value, "assetClass");
  const symbol = read(value, "symbol");
  const productName = read(value, "productName");
  const suitability = read(value, "suitability");
  const currency = read(value, "currency");
  const currentPrice = read(value, "currentPrice");
  const quantity = read(value, "quantity");
  const averagePrice = read(value, "averagePrice");
  if (
    !isString(accountId) ||
    !isString(assetClass) ||
    !isString(symbol) ||
    !isString(productName) ||
    !isSuitability(suitability) ||
    !isCurrency(currency) ||
    !isNumber(currentPrice) ||
    !isNumber(quantity) ||
    !isNumber(averagePrice)
  ) {
    return null;
  }
  const priceUpdatedAt = optionalString(read(value, "priceUpdatedAt"));
  const priceSource = optionalString(read(value, "priceSource"));
  return {
    accountId,
    assetClass,
    symbol,
    productName,
    suitability,
    currency,
    currentPrice,
    quantity,
    averagePrice,
    ...(priceUpdatedAt === undefined ? {} : { priceUpdatedAt }),
    ...(priceSource === undefined ? {} : { priceSource }),
  };
};

const cashFrom = (value: unknown): CashPosition | null => {
  if (!isObject(value)) {
    return null;
  }
  const accountId = read(value, "accountId");
  const currency = read(value, "currency");
  const amount = read(value, "amount");
  return isString(accountId) && isCurrency(currency) && isNumber(amount) ? { accountId, currency, amount } : null;
};

const parseArray = <T>(value: unknown, parser: (item: unknown) => T | null): readonly T[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  const parsed = value.map(parser);
  return parsed.every((item) => item !== null) ? parsed : null;
};

export const createPortfolioBackup = (portfolio: PortfolioState): PortfolioBackup => ({
  schemaVersion,
  exportedAt: new Date().toISOString(),
  portfolio,
});

export const parsePortfolioBackup = (raw: string): PortfolioState => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new PortfolioBackupError(error instanceof SyntaxError ? "백업 파일이 JSON 형식이 아닙니다." : "백업 파일을 읽을 수 없습니다.");
  }
  if (!isObject(parsed) || read(parsed, "schemaVersion") !== schemaVersion || !isObject(read(parsed, "portfolio"))) {
    throw new PortfolioBackupError("지원하지 않는 백업 파일입니다.");
  }
  const portfolio = read(parsed, "portfolio");
  if (!isObject(portfolio)) {
    throw new PortfolioBackupError("백업 파일의 데이터 구조가 올바르지 않습니다.");
  }
  const accounts = parseArray(read(portfolio, "accounts"), accountFrom);
  const instruments = parseArray(read(portfolio, "instruments"), instrumentFrom);
  const targets = parseArray(read(portfolio, "targets"), targetFrom);
  const holdings = parseArray(read(portfolio, "holdings"), holdingFrom);
  const cashPositions = parseArray(read(portfolio, "cashPositions"), cashFrom);
  if (!accounts || !instruments || !targets || !holdings || !cashPositions) {
    throw new PortfolioBackupError("백업 파일의 데이터 구조가 올바르지 않습니다.");
  }
  return { accounts, instruments, targets, holdings, cashPositions };
};

export const savePortfolioState = (portfolio: PortfolioState) => {
  window.localStorage.setItem(storageKey, JSON.stringify(createPortfolioBackup(portfolio)));
};

export const loadPortfolioState = (): PortfolioState | null => {
  const raw = window.localStorage.getItem(storageKey);
  return raw === null ? null : parsePortfolioBackup(raw);
};

export const clearPortfolioState = () => {
  window.localStorage.removeItem(storageKey);
};
