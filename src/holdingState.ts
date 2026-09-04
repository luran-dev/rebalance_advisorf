import type { Holding, HoldingDraft, HoldingKey, Instrument, MarketQuote, TargetAsset } from "./types";

export type HoldingSelection = {
  readonly draft: HoldingDraft;
  readonly target: TargetAsset;
  readonly instrument: Instrument;
};

export type HoldingUpdate = HoldingSelection & {
  readonly key: HoldingKey;
};

export const hasHolding = (
  holdings: readonly Holding[],
  key: HoldingKey,
  ignoredKey: HoldingKey | null = null,
): boolean =>
  holdings.some(
    (holding) =>
      holding.accountId === key.accountId &&
      holding.symbol === key.symbol &&
      (ignoredKey === null || holding.accountId !== ignoredKey.accountId || holding.symbol !== ignoredKey.symbol),
  );

export const holdingFromDraft = (
  draft: HoldingDraft,
  target: TargetAsset,
  instrument: Instrument,
): Holding => ({
  accountId: draft.accountId,
  assetClass: target.assetClass,
  symbol: target.symbol,
  productName: target.productName,
  suitability: target.suitability,
  currency: instrument.currency,
  currentPrice: draft.currentPrice,
  quantity: draft.quantity,
  averagePrice: draft.averagePrice,
});

export const addHolding = (
  holdings: readonly Holding[],
  holding: HoldingSelection,
): readonly Holding[] => [...holdings, holdingFromDraft(holding.draft, holding.target, holding.instrument)];

export const updateHolding = ({
  holdings,
  currentKey,
  draft,
  target,
  instrument,
}: {
  readonly holdings: readonly Holding[];
  readonly currentKey: HoldingKey;
  readonly draft: HoldingDraft;
  readonly target: TargetAsset;
  readonly instrument: Instrument;
}): readonly Holding[] =>
  holdings.map((holding) =>
    holding.accountId === currentKey.accountId && holding.symbol === currentKey.symbol
      ? holdingFromDraft(draft, target, instrument)
      : holding,
  );

export const deleteHolding = (holdings: readonly Holding[], key: HoldingKey): readonly Holding[] =>
  holdings.filter((holding) => holding.accountId !== key.accountId || holding.symbol !== key.symbol);

export const updateHoldingPrice = (
  holdings: readonly Holding[],
  quote: MarketQuote,
): readonly Holding[] =>
  holdings.map((holding) =>
    holding.symbol === quote.symbol
      ? {
          ...holding,
          currentPrice: quote.price,
          currency: quote.currency,
          priceUpdatedAt: quote.updatedAt,
          priceSource: quote.source,
        }
      : holding,
  );
