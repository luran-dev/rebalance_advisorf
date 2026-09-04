export type AccountId = string;
export type SymbolCode = string;

export type Currency = "KRW" | "USD";
export type TradeDirection = "buy" | "sell" | "hold";
export type ExchangeRates = Readonly<Record<Currency, number>>;

export const countryOptions = ["한국", "미국"] as const;

export type Country = (typeof countryOptions)[number];

export const suitabilityOptions = ["IRP", "연금저축", "IRP/연금저축", "ISA", "일반"] as const;

export type Suitability = (typeof suitabilityOptions)[number];

export const instrumentCategories = [
  "개별주식",
  "S&P500",
  "나스닥100",
  "다우존스",
  "채권",
  "금",
  "금리",
  "해외개별주식",
  "해외 ETF",
  "국내 ETF",
  "현금",
  "리츠",
] as const;

export type InstrumentCategory = (typeof instrumentCategories)[number];

export type Account = {
  readonly id: AccountId;
  readonly name: string;
  readonly broker: string;
  readonly defaultFx?: number;
};

export type AccountDraft = {
  readonly name: string;
  readonly broker: string;
};

export type Instrument = {
  readonly name: string;
  readonly symbol: SymbolCode;
  readonly country: Country;
  readonly currency: Currency;
  readonly category: InstrumentCategory;
  readonly price?: number;
  readonly priceUpdatedAt?: string;
  readonly priceSource?: string;
  readonly fxRate?: number;
  readonly fxUpdatedAt?: string;
  readonly fxSource?: string;
};

export type InstrumentDraft = {
  readonly name: string;
  readonly symbol: string;
  readonly country: Country;
  readonly currency: Currency;
  readonly category: InstrumentCategory;
};

export type TargetAsset = {
  readonly accountId: AccountId;
  readonly assetClass: string;
  readonly symbol: SymbolCode;
  readonly productName: string;
  readonly suitability: Suitability;
  readonly targetPercent: number;
};

export type TargetAllocationDraft = {
  readonly accountId: AccountId;
  readonly symbol: SymbolCode;
  readonly suitability: Suitability;
  readonly targetPercent: number;
};

export type TargetAllocationKey = {
  readonly accountId: AccountId;
  readonly symbol: SymbolCode;
};

export type Holding = {
  readonly accountId: AccountId;
  readonly assetClass: string;
  readonly symbol: SymbolCode;
  readonly productName: string;
  readonly suitability: Suitability | "-";
  readonly currency: Currency;
  readonly currentPrice: number;
  readonly priceUpdatedAt?: string;
  readonly priceSource?: string;
  readonly quantity: number;
  readonly averagePrice: number;
};

export type HoldingDraft = {
  readonly accountId: AccountId;
  readonly symbol: SymbolCode;
  readonly currentPrice: number;
  readonly quantity: number;
  readonly averagePrice: number;
};

export type HoldingKey = {
  readonly accountId: AccountId;
  readonly symbol: SymbolCode;
};

export type MarketQuote = {
  readonly symbol: SymbolCode;
  readonly price: number;
  readonly currency: Currency;
  readonly updatedAt: string;
  readonly source: string;
};

export type FxQuote = {
  readonly source: string;
  readonly currency: Currency;
  readonly quote: "KRW";
  readonly rate: number;
  readonly date: string;
};

export type CashPosition = {
  readonly accountId: AccountId;
  readonly currency: Currency;
  readonly amount: number;
};

export type HoldingRow = Holding & {
  readonly investedValue: number;
  readonly marketValue: number;
  readonly profit: number;
  readonly returnPercent: number;
  readonly currentPercent: number;
  readonly targetPercent: number;
  readonly targetQuantity: number;
  readonly tradeQuantity: number;
  readonly direction: TradeDirection;
};

export type AssetSummary = {
  readonly assetClass: string;
  readonly investedValue: number;
  readonly marketValue: number;
  readonly returnPercent: number;
  readonly percent: number;
};
