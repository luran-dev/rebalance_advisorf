import { describe, expect, it } from "vitest";
import { buildAccountSnapshot, summarizeAssets } from "./calculations";
import { cashPositions, holdings, targetAssets } from "./data";

describe("buildAccountSnapshot", () => {
  it("calculates buy and sell guidance when holdings drift from targets", () => {
    const snapshot = buildAccountSnapshot(holdings, targetAssets, cashPositions, "pension-future");
    const nasdaqRow = snapshot.rows.find((row) => row.symbol === "379810");
    const bondRow = snapshot.rows.find((row) => row.symbol === "453850");

    expect(nasdaqRow?.direction).toBe("sell");
    expect(bondRow?.direction).toBe("buy");
    expect(snapshot.marketValue).toBeGreaterThan(snapshot.investedValue);
  });

  it("uses supplied exchange rates for USD holdings", () => {
    const snapshot = buildAccountSnapshot(holdings, targetAssets, cashPositions, "global-shinhan", {
      KRW: 1,
      USD: 1400,
    });
    const qqq = snapshot.rows.find((row) => row.symbol === "QQQ");

    expect(qqq?.marketValue).toBeCloseTo(709.24 * 1400);
  });

  it("uses each account total including cash for all-account trade guidance", () => {
    const accountHoldings = [
      {
        accountId: "one",
        assetClass: "S&P500",
        symbol: "AAA",
        productName: "AAA",
        suitability: "일반",
        currency: "KRW",
        currentPrice: 100,
        quantity: 1,
        averagePrice: 100,
      },
      {
        accountId: "two",
        assetClass: "S&P500",
        symbol: "BBB",
        productName: "BBB",
        suitability: "일반",
        currency: "KRW",
        currentPrice: 100,
        quantity: 1,
        averagePrice: 100,
      },
    ] as const;
    const accountTargets = [
      { accountId: "one", assetClass: "S&P500", symbol: "AAA", productName: "AAA", suitability: "일반", targetPercent: 50 },
      { accountId: "two", assetClass: "S&P500", symbol: "BBB", productName: "BBB", suitability: "일반", targetPercent: 50 },
    ] as const;
    const accountCash = [
      { accountId: "one", currency: "KRW", amount: 900 },
      { accountId: "two", currency: "KRW", amount: 0 },
    ] as const;

    const snapshot = buildAccountSnapshot(accountHoldings, accountTargets, accountCash);

    expect(snapshot.rows.find((row) => row.symbol === "AAA")?.tradeQuantity).toBe(4);
    expect(snapshot.rows.find((row) => row.symbol === "BBB")?.tradeQuantity).toBe(0);
  });
});

describe("summarizeAssets", () => {
  it("adds cash as its own allocation bucket", () => {
    const snapshot = buildAccountSnapshot(holdings, targetAssets, cashPositions);
    const summary = summarizeAssets(snapshot.rows, snapshot.cashValue);
    const cash = summary.find((item) => item.assetClass === "현금");

    expect(cash?.marketValue).toBe(45766144);
    expect(summary.reduce((total, item) => total + item.percent, 0)).toBeCloseTo(100);
  });
});
