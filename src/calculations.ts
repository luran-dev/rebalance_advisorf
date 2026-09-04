import type {
  AccountId,
  AssetSummary,
  CashPosition,
  ExchangeRates,
  Holding,
  HoldingRow,
  Instrument,
  RiskLabel,
  RiskSummary,
  SymbolCode,
  TargetAsset,
  TradeDirection,
} from "./types";

export const FX_RATE_KRW_PER_USD = 1279;
export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  KRW: 1,
  USD: FX_RATE_KRW_PER_USD,
};

type AccountSnapshot = {
  readonly rows: readonly HoldingRow[];
  readonly cashValue: number;
  readonly investedValue: number;
  readonly marketValue: number;
  readonly returnPercent: number;
};

const toKrw = (value: number, currency: keyof ExchangeRates, exchangeRates: ExchangeRates) =>
  value * exchangeRates[currency];

const targetKey = (accountId: AccountId, symbol: SymbolCode) => `${accountId}:${symbol}`;

const addToMap = (map: Map<AccountId, number>, accountId: AccountId, value: number) => {
  map.set(accountId, (map.get(accountId) ?? 0) + value);
};

const tradeDirection = (tradeQuantity: number): TradeDirection => {
  if (tradeQuantity > 0) {
    return "buy";
  }
  if (tradeQuantity < 0) {
    return "sell";
  }
  return "hold";
};

export const sumCash = (
  cashPositions: readonly CashPosition[],
  accountId?: AccountId,
  exchangeRates: ExchangeRates = DEFAULT_EXCHANGE_RATES,
): number =>
  cashPositions
    .filter((cash) => accountId === undefined || cash.accountId === accountId)
    .reduce((total, cash) => total + toKrw(cash.amount, cash.currency, exchangeRates), 0);

export const buildRows = (
  holdings: readonly Holding[],
  targets: readonly TargetAsset[],
  cashPositions: readonly CashPosition[],
  accountId?: AccountId,
  exchangeRates: ExchangeRates = DEFAULT_EXCHANGE_RATES,
): readonly HoldingRow[] => {
  const scopedHoldings = holdings.filter(
    (holding) => accountId === undefined || holding.accountId === accountId,
  );
  const targetBySymbol = new Map(
    targets.map((target) => [targetKey(target.accountId, target.symbol), target.targetPercent]),
  );
  const marketTotalByAccount = new Map<AccountId, number>();
  for (const holding of scopedHoldings) {
    addToMap(
      marketTotalByAccount,
      holding.accountId,
      toKrw(holding.currentPrice * holding.quantity, holding.currency, exchangeRates),
    );
  }
  for (const cash of cashPositions) {
    if (accountId === undefined || cash.accountId === accountId) {
      addToMap(marketTotalByAccount, cash.accountId, toKrw(cash.amount, cash.currency, exchangeRates));
    }
  }

  return scopedHoldings.map((holding) => {
    const marketValue = toKrw(holding.currentPrice * holding.quantity, holding.currency, exchangeRates);
    const investedValue = toKrw(holding.averagePrice * holding.quantity, holding.currency, exchangeRates);
    const targetPercent = targetBySymbol.get(targetKey(holding.accountId, holding.symbol)) ?? 0;
    const marketTotal = marketTotalByAccount.get(holding.accountId) ?? 0;
    const targetValue = marketTotal * (targetPercent / 100);
    const targetQuantity = holding.currentPrice > 0 ? targetValue / toKrw(holding.currentPrice, holding.currency, exchangeRates) : 0;
    const roundedTradeQuantity = Math.round(targetQuantity - holding.quantity);
    const tradeQuantity = roundedTradeQuantity === 0 ? 0 : roundedTradeQuantity;

    return {
      ...holding,
      investedValue,
      marketValue,
      profit: marketValue - investedValue,
      returnPercent: investedValue === 0 ? 0 : ((marketValue - investedValue) / investedValue) * 100,
      currentPercent: marketTotal === 0 ? 0 : (marketValue / marketTotal) * 100,
      targetPercent,
      targetQuantity,
      tradeQuantity,
      direction: tradeDirection(tradeQuantity),
    };
  });
};

export const buildAccountSnapshot = (
  holdings: readonly Holding[],
  targets: readonly TargetAsset[],
  cashPositions: readonly CashPosition[],
  accountId?: AccountId,
  exchangeRates: ExchangeRates = DEFAULT_EXCHANGE_RATES,
): AccountSnapshot => {
  const rows = buildRows(holdings, targets, cashPositions, accountId, exchangeRates);
  const cashValue = sumCash(cashPositions, accountId, exchangeRates);
  const investedValue = rows.reduce((total, row) => total + row.investedValue, 0) + cashValue;
  const marketValue = rows.reduce((total, row) => total + row.marketValue, 0) + cashValue;

  return {
    rows,
    cashValue,
    investedValue,
    marketValue,
    returnPercent: investedValue === 0 ? 0 : ((marketValue - investedValue) / investedValue) * 100,
  };
};

export const summarizeAssets = (rows: readonly HoldingRow[], cashValue: number): readonly AssetSummary[] => {
  const grouped = new Map<string, Omit<AssetSummary, "returnPercent" | "percent">>();

  for (const row of rows) {
    const existing = grouped.get(row.assetClass);
    const next = {
      assetClass: row.assetClass,
      investedValue: (existing?.investedValue ?? 0) + row.investedValue,
      marketValue: (existing?.marketValue ?? 0) + row.marketValue,
    };
    grouped.set(row.assetClass, next);
  }

  grouped.set("현금", {
    assetClass: "현금",
    investedValue: cashValue,
    marketValue: cashValue,
  });

  const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.marketValue, 0);

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      returnPercent: item.investedValue === 0 ? 0 : ((item.marketValue - item.investedValue) / item.investedValue) * 100,
      percent: total === 0 ? 0 : (item.marketValue / total) * 100,
    }))
    .sort((a, b) => b.marketValue - a.marketValue);
};

const riskOrder: readonly (RiskLabel | "미계산")[] = ["높음", "보통", "낮음", "데이터 부족", "미계산"];

export const summarizeRisks = (
  rows: readonly HoldingRow[],
  instruments: readonly Instrument[],
): readonly RiskSummary[] => {
  const instrumentsBySymbol = new Map(instruments.map((instrument) => [instrument.symbol, instrument]));
  const grouped = new Map<RiskLabel | "미계산", Omit<RiskSummary, "percent">>();

  for (const row of rows) {
    const instrument = instrumentsBySymbol.get(row.symbol);
    const riskLabel = instrument?.riskLabel ?? "미계산";
    const riskTone = instrument?.riskTone ?? "neutral";
    const existing = grouped.get(riskLabel);
    grouped.set(riskLabel, {
      riskLabel,
      riskTone,
      marketValue: (existing?.marketValue ?? 0) + row.marketValue,
    });
  }

  const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.marketValue, 0);

  return riskOrder
    .map((riskLabel) => grouped.get(riskLabel))
    .filter((item): item is Omit<RiskSummary, "percent"> => item !== undefined)
    .map((item) => ({
      ...item,
      percent: total === 0 ? 0 : (item.marketValue / total) * 100,
    }));
};
