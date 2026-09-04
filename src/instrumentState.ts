import type { FxQuote, Instrument, InstrumentDraft, MarketQuote, SymbolCode } from "./types";

const normalizeSymbol = (symbol: string): SymbolCode => symbol.trim().toUpperCase();

const normalizeDraft = (draft: InstrumentDraft): Instrument => ({
  name: draft.name.trim(),
  symbol: normalizeSymbol(draft.symbol),
  country: draft.country,
  currency: draft.currency,
  category: draft.category,
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
): readonly Instrument[] => [...instruments, normalizeDraft(draft)];

export const updateInstrument = (
  instruments: readonly Instrument[],
  currentSymbol: SymbolCode,
  draft: InstrumentDraft,
): readonly Instrument[] =>
  instruments.map((instrument) => (instrument.symbol === currentSymbol ? normalizeDraft(draft) : instrument));

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
