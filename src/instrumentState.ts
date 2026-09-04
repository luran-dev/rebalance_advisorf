import type { PortfolioState } from "./accountState";
import type { FxQuote, Instrument, InstrumentDraft, MarketQuote, RiskLabel, RiskTone, SymbolCode } from "./types";

const normalizeSymbol = (symbol: string): SymbolCode => symbol.trim().toUpperCase();

export type InstrumentRiskMetadata = {
  readonly riskLabel: RiskLabel;
  readonly riskTone: RiskTone;
  readonly volatilityPercent: number | null;
  readonly riskUpdatedAt: string;
  readonly riskSource: string;
};

const normalizeDraft = (draft: InstrumentDraft, risk: InstrumentRiskMetadata | null = null): Instrument => ({
  name: draft.name.trim(),
  symbol: normalizeSymbol(draft.symbol),
  country: draft.country,
  currency: draft.currency,
  category: draft.category,
  ...(risk === null ? {} : { riskLabel: risk.riskLabel }),
  ...(risk === null ? {} : { riskTone: risk.riskTone }),
  ...(risk?.volatilityPercent === null || risk === null ? {} : { volatilityPercent: risk.volatilityPercent }),
  ...(risk === null ? {} : { riskUpdatedAt: risk.riskUpdatedAt }),
  ...(risk === null ? {} : { riskSource: risk.riskSource }),
});

export const hasInstrumentSymbol = (
  instruments: readonly Instrument[],
  symbol: string,
  ignoredSymbol: SymbolCode | null = null,
): boolean => {
  const normalizedSymbol = normalizeSymbol(symbol);

  return instruments.some(
    (instrument) => instrument.symbol === normalizedSymbol && instrument.symbol !== ignoredSymbol,
  );
};

export const addInstrument = (
  instruments: readonly Instrument[],
  draft: InstrumentDraft,
  risk: InstrumentRiskMetadata | null = null,
): readonly Instrument[] => [...instruments, normalizeDraft(draft, risk)];

export const updateInstrument = (
  instruments: readonly Instrument[],
  currentSymbol: SymbolCode,
  draft: InstrumentDraft,
  risk: InstrumentRiskMetadata | null = null,
): readonly Instrument[] =>
  instruments.map((instrument) => (instrument.symbol === currentSymbol ? normalizeDraft(draft, risk) : instrument));

export const updatePortfolioInstrument = (
  state: PortfolioState,
  currentSymbol: SymbolCode,
  draft: InstrumentDraft,
  risk: InstrumentRiskMetadata | null = null,
): PortfolioState => {
  const instrument = normalizeDraft(draft, risk);
  return {
    ...state,
    instruments: updateInstrument(state.instruments, currentSymbol, draft, risk),
    targets: state.targets.map((target) =>
      target.symbol === currentSymbol
        ? {
            ...target,
            assetClass: instrument.category,
            symbol: instrument.symbol,
            productName: instrument.name,
          }
        : target,
    ),
    holdings: state.holdings.map((holding) =>
      holding.symbol === currentSymbol
        ? {
            ...holding,
            assetClass: instrument.category,
            symbol: instrument.symbol,
            productName: instrument.name,
            currency: instrument.currency,
          }
        : holding,
    ),
  };
};

export const deleteInstrument = (
  instruments: readonly Instrument[],
  symbol: SymbolCode,
): readonly Instrument[] => instruments.filter((instrument) => instrument.symbol !== symbol);

export const updateInstrumentPrice = (
  instruments: readonly Instrument[],
  quote: MarketQuote,
): readonly Instrument[] =>
  instruments.map((instrument) =>
    instrument.symbol === quote.symbol
      ? {
          ...instrument,
          currency: quote.currency,
          price: quote.price,
          priceUpdatedAt: quote.updatedAt,
          priceSource: quote.source,
        }
      : instrument,
  );

export const updateInstrumentFx = (
  instruments: readonly Instrument[],
  quote: FxQuote,
): readonly Instrument[] =>
  instruments.map((instrument) =>
    instrument.currency === quote.currency
      ? {
          ...instrument,
          fxRate: quote.rate,
          fxUpdatedAt: quote.date,
          fxSource: quote.source,
        }
      : instrument,
  );
