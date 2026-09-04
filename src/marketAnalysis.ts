import { formatKrw, formatPercent } from "./format";
import type { MarketDetailSubject, MarketHistoryItem, RiskLabel, RiskTone } from "./types";

export type MarketMetric = {
  readonly label: string;
  readonly value: string;
  readonly tone: "neutral" | "gain" | "loss" | "warning";
};

export type MarketAnalysis = {
  readonly riskLabel: RiskLabel;
  readonly riskTone: RiskTone;
  readonly volatilityPercent: number | null;
  readonly metrics: readonly MarketMetric[];
  readonly comments: readonly string[];
};

const annualizedVolatility = (items: readonly MarketHistoryItem[]): number | null => {
  const returns = items
    .map((item, index) => {
      const previous = items[index - 1];
      return previous && previous.close > 0 ? item.close / previous.close - 1 : null;
    })
    .filter((value): value is number => value !== null);
  if (returns.length < 2) {
    return null;
  }
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
};

export type MarketRisk = {
  readonly riskLabel: RiskLabel;
  readonly riskTone: RiskTone;
  readonly volatilityPercent: number | null;
};

const riskFromVolatility = (volatility: number | null): Pick<MarketRisk, "riskLabel" | "riskTone"> => {
  if (volatility === null) {
    return { riskLabel: "데이터 부족", riskTone: "neutral" };
  }
  if (volatility < 18) {
    return { riskLabel: "낮음", riskTone: "gain" };
  }
  if (volatility < 30) {
    return { riskLabel: "보통", riskTone: "warning" };
  }
  return { riskLabel: "높음", riskTone: "loss" };
};

export const buildMarketRisk = (history: readonly MarketHistoryItem[]): MarketRisk => {
  const volatility = annualizedVolatility(history);
  return { ...riskFromVolatility(volatility), volatilityPercent: volatility };
};

const commentsFor = (subject: MarketDetailSubject, volatility: number | null): readonly string[] => {
  const comments: string[] = [];
  if (subject.currentPercent !== undefined && subject.targetPercent !== undefined) {
    const drift = subject.currentPercent - subject.targetPercent;
    if (Math.abs(drift) < 1) {
      comments.push("현재 비중이 목표 비중과 거의 일치합니다.");
    } else if (drift > 0) {
      comments.push(`현재 비중이 목표보다 ${formatPercent(drift).replace("%", "%p")} 높습니다.`);
    } else {
      comments.push(`현재 비중이 목표보다 ${formatPercent(Math.abs(drift)).replace("%", "%p")} 낮습니다.`);
    }
  }
  if (subject.returnPercent !== undefined) {
    const direction = subject.returnPercent >= 0 ? "플러스" : "마이너스";
    comments.push(`평가수익률은 ${formatPercent(subject.returnPercent)}로 ${direction} 구간입니다.`);
  }
  if (volatility !== null) {
    comments.push(`최근 가격 변동성은 연환산 ${formatPercent(volatility)} 수준입니다.`);
  }
  return comments.length > 0 ? comments : ["보유 데이터가 연결되면 비중과 수익률 코멘트를 계산합니다."];
};

export const buildMarketAnalysis = (
  subject: MarketDetailSubject,
  history: readonly MarketHistoryItem[],
): MarketAnalysis => {
  const risk = buildMarketRisk(history);
  const metrics: readonly MarketMetric[] = [
    { label: "위험도", value: risk.riskLabel, tone: risk.riskTone },
    {
      label: "보유비중",
      value: subject.currentPercent === undefined ? "-" : formatPercent(subject.currentPercent),
      tone: "neutral",
    },
    {
      label: "평가수익률",
      value: subject.returnPercent === undefined ? "-" : formatPercent(subject.returnPercent),
      tone: subject.returnPercent === undefined ? "neutral" : subject.returnPercent >= 0 ? "gain" : "loss",
    },
    {
      label: "평가금액",
      value: subject.marketValue === undefined ? "-" : formatKrw(subject.marketValue),
      tone: "neutral",
    },
  ];
  return {
    ...risk,
    metrics,
    comments: commentsFor(subject, risk.volatilityPercent),
  };
};
