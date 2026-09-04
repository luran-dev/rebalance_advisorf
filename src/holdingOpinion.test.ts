import { describe, expect, it } from "vitest";
import { buildHoldingOpinion } from "./holdingOpinion";
import type { HoldingRow } from "./types";

const baseRow: HoldingRow = {
  accountId: "global-shinhan",
  assetClass: "해외 ETF",
  symbol: "QQQ",
  productName: "Invesco QQQ Trust",
  suitability: "일반",
  currency: "USD",
  currentPrice: 709.24,
  quantity: 1,
  averagePrice: 280.69,
  investedValue: 380_450,
  marketValue: 961_311,
  profit: 580_861,
  returnPercent: 152.68,
  currentPercent: 24,
  targetPercent: 20,
  targetQuantity: 0.84,
  tradeQuantity: 0.16,
  direction: "sell",
};

describe("buildHoldingOpinion", () => {
  it("Given a holding above target band When opinion is built Then it recommends partial sell with basis", () => {
    const opinion = buildHoldingOpinion(baseRow);

    expect(opinion.action).toBe("분할매도");
    expect(opinion.reason).toContain("목표 상단 23%를 초과");
  });

  it("Given a holding below target band with gain When opinion is built Then it recommends partial buy", () => {
    const opinion = buildHoldingOpinion({
      ...baseRow,
      currentPercent: 12,
      targetPercent: 20,
      returnPercent: 14,
      direction: "buy",
    });

    expect(opinion.action).toBe("분할매수");
    expect(opinion.reason).toContain("목표 하단 17% 미달");
  });
});
