import type { InstrumentRiskMetadata } from "./instrumentState";
import { fetchMarketHistory } from "./marketApi";
import { buildMarketRisk } from "./marketAnalysis";
import type { SymbolCode } from "./types";

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const unknownInstrumentRisk = (source: string): InstrumentRiskMetadata => ({
  riskLabel: "데이터 부족",
  riskTone: "neutral",
  volatilityPercent: null,
  riskUpdatedAt: todayIso(),
  riskSource: source,
});

export const resolveInstrumentRisk = async (symbol: SymbolCode): Promise<InstrumentRiskMetadata> => {
  try {
    const history = await fetchMarketHistory(symbol.trim().toUpperCase(), "6m");
    const risk = buildMarketRisk(history.items);
    return {
      ...risk,
      riskUpdatedAt: history.items.at(-1)?.date ?? todayIso(),
      riskSource: history.source,
    };
  } catch (error) {
    return unknownInstrumentRisk(error instanceof Error ? error.message : "시세 조회 실패");
  }
};
