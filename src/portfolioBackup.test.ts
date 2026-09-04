import { describe, expect, it } from "vitest";
import { createPortfolioBackup, parsePortfolioBackup } from "./portfolioBackup";
import type { PortfolioState } from "./accountState";

const state: PortfolioState = {
  accounts: [{ id: "global-shinhan", name: "종합계좌", broker: "신한" }],
  instruments: [{ name: "Invesco QQQ Trust", symbol: "QQQ", country: "미국", currency: "USD", category: "해외 ETF" }],
  targets: [
    {
      accountId: "global-shinhan",
      assetClass: "해외 ETF",
      symbol: "QQQ",
      productName: "Invesco QQQ Trust",
      suitability: "일반",
      targetPercent: 20,
    },
  ],
  holdings: [
    {
      accountId: "global-shinhan",
      assetClass: "해외 ETF",
      symbol: "QQQ",
      productName: "Invesco QQQ Trust",
      suitability: "일반",
      currency: "USD",
      currentPrice: 709.24,
      quantity: 1,
      averagePrice: 280.69,
    },
  ],
  cashPositions: [{ accountId: "global-shinhan", currency: "KRW", amount: 1_000_000 }],
};

describe("portfolio backup", () => {
  it("Given a backup JSON When parsed Then it restores the portfolio state", () => {
    const backup = createPortfolioBackup(state);
    const parsed = parsePortfolioBackup(JSON.stringify(backup));

    expect(parsed).toEqual(state);
  });

  it("Given an invalid backup JSON When parsed Then it reports a restore error", () => {
    expect(() => parsePortfolioBackup('{"schemaVersion":1,"portfolio":{"accounts":[]}}')).toThrow(
      "백업 파일의 데이터 구조가 올바르지 않습니다.",
    );
  });
});
