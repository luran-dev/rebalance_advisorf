import { describe, expect, it } from "vitest";
import { buildMarketAnalysis } from "./marketAnalysis";
import type { MarketDetailSubject, MarketHistoryItem } from "./types";

const subject: MarketDetailSubject = {
  accountId: "global-shinhan",
  accountName: "종합계좌",
  assetClass: "해외 ETF",
  symbol: "QQQ",
  productName: "Invesco QQQ Trust",
  suitability: "일반",
  currency: "USD",
  currentPercent: 24,
  targetPercent: 20,
  returnPercent: 18,
  marketValue: 961_311,
};

const history: readonly MarketHistoryItem[] = [
  { date: "2026-01-01", open: 100, high: 101, low: 99, close: 100, volume: 10 },
  { date: "2026-01-02", open: 100, high: 120, low: 98, close: 120, volume: 10 },
  { date: "2026-01-03", open: 120, high: 132, low: 118, close: 130, volume: 10 },
  { date: "2026-01-04", open: 130, high: 150, low: 128, close: 145, volume: 10 },
];

describe("buildMarketAnalysis", () => {
  it("Given volatile overweight profitable holding When analysis is built Then risk and comments reflect the position", () => {
    const analysis = buildMarketAnalysis(subject, history);

    expect(analysis.riskLabel).toBe("높음");
    expect(analysis.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "보유비중", value: "24%" }),
        expect.objectContaining({ label: "평가수익률", value: "18%" }),
      ]),
    );
    expect(analysis.comments.some((comment) => comment.includes("목표보다 4%p 높습니다"))).toBe(true);
  });
});
