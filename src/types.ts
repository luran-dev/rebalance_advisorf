export type AccountId = string;
export type SymbolCode = string;

export type Currency = "KRW" | "USD";
export type TradeDirection = "buy" | "sell" | "hold";

export type Account = {
  readonly id: AccountId;
  readonly name: string;
  readonly broker: string;
};

export type AccountDraft = {
  readonly name: string;
  readonly broker: string;
};

export type TargetAsset = {
  readonly accountId: AccountId;
  readonly assetClass: string;
  readonly symbol: SymbolCode;
  readonly productName: string;
  readonly suitability: string;
  readonly targetPercent: number;
};

export type Holding = {
  readonly accountId: AccountId;
  readonly assetClass: string;
  readonly symbol: SymbolCode;
  readonly productName: string;
  readonly suitability: string;
  readonly currency: Currency;
  readonly currentPrice: number;
  readonly quantity: number;
  readonly averagePrice: number;
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
