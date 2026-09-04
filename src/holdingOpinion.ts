import { formatPercent } from "./format";
import type { HoldingRow } from "./types";

export type HoldingOpinion = {
  readonly action: "분할매도" | "분할매수" | "매수대기" | "위험축소" | "장기보유" | "관찰";
  readonly reason: string;
  readonly details: readonly string[];
  readonly tone: "gain" | "loss" | "warning" | "neutral";
};

const roleCaps = {
  "S&P500": 35,
  나스닥100: 20,
  다우존스: 20,
  채권: 25,
  금: 15,
  금리: 25,
  해외개별주식: 8,
  "해외 ETF": 20,
  "국내 ETF": 20,
  개별주식: 8,
  현금: 25,
  리츠: 12,
} as const;

const capFor = (assetClass: string): number => {
  const cap = roleCaps[assetClass as keyof typeof roleCaps];
  return cap ?? 20;
};

const bandFor = (targetPercent: number): number => Math.min(5, Math.max(2, targetPercent * 0.15));

const trendLabel = (row: HoldingRow): "상승" | "회복" | "하락" | "약세" | "중립" => {
  if (row.returnPercent >= 20) {
    return "상승";
  }
  if (row.returnPercent >= 5) {
    return "회복";
  }
  if (row.returnPercent <= -20) {
    return "하락";
  }
  if (row.returnPercent < 0) {
    return "약세";
  }
  return "중립";
};

export const buildHoldingOpinion = (row: HoldingRow): HoldingOpinion => {
  const target = row.targetPercent > 0 ? row.targetPercent : Math.min(row.currentPercent, capFor(row.assetClass));
  const band = bandFor(target);
  const lower = target - band;
  const upper = target + band;
  const trend = trendLabel(row);
  const details = [
    `관리범위 ${formatPercent(lower)}~${formatPercent(upper)}`,
    `수익률 ${formatPercent(row.returnPercent)}`,
  ];

  if (row.currentPercent > upper) {
    return {
      action: "분할매도",
      reason: `목표 상단 ${formatPercent(upper)}를 초과`,
      details,
      tone: "loss",
    };
  }
  if (row.assetClass.includes("성장") && row.returnPercent <= -20) {
    return {
      action: "위험축소",
      reason: "성장 자산의 하락폭이 커 위험 축소 필요",
      details,
      tone: "loss",
    };
  }
  if (row.currentPercent < lower && (trend === "상승" || trend === "회복")) {
    return {
      action: "분할매수",
      reason: `목표 하단 ${formatPercent(lower)} 미달, 추세 ${trend}`,
      details,
      tone: "gain",
    };
  }
  if (row.currentPercent < lower) {
    return {
      action: "매수대기",
      reason: `목표 하단 미달이지만 ${trend} 추세로 회복 확인 전 대기`,
      details,
      tone: "warning",
    };
  }
  if (row.assetClass === "S&P500" || row.assetClass === "채권") {
    return {
      action: "장기보유",
      reason: `${row.assetClass} 비중이 관리범위 내, 추세 ${trend}`,
      details,
      tone: "neutral",
    };
  }
  return {
    action: "관찰",
    reason: `${row.assetClass} 비중이 관리범위 내, 추세 ${trend}`,
    details,
    tone: "neutral",
  };
};
