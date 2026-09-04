import { describe, expect, it } from "vitest";
import { addHolding, deleteHolding, hasHolding, updateHolding, updateHoldingPrice } from "./holdingState";
import { holdings, instruments, targetAssets } from "./data";

const target = targetAssets[0];
const instrument = instruments.find((item) => item.symbol === target?.symbol);

if (target === undefined || instrument === undefined) {
  throw new Error("Holding state tests require seeded target and instrument data.");
}

describe("holding state", () => {
  it("creates holdings from target allocation metadata", () => {
    const draft = {
      accountId: target.accountId,
      symbol: target.symbol,
      currentPrice: 10,
      quantity: 2,
      averagePrice: 8,
    };
    const added = addHolding([], { draft, target, instrument });

    expect(added[0]).toEqual({
      accountId: target.accountId,
      assetClass: target.assetClass,
      symbol: target.symbol,
      productName: target.productName,
      suitability: target.suitability,
      currency: instrument.currency,
      currentPrice: 10,
      quantity: 2,
      averagePrice: 8,
    });
  });

  it("updates and deletes holdings by account and symbol", () => {
    const updated = updateHolding({
      holdings,
      currentKey: { accountId: "pension-future", symbol: "379800" },
      draft: { accountId: "pension-future", symbol: "379800", currentPrice: 24000, quantity: 50, averagePrice: 20000 },
      target,
      instrument,
    });
    const row = updated.find((holding) => holding.accountId === "pension-future" && holding.symbol === "379800");
    const deleted = deleteHolding(updated, { accountId: "pension-future", symbol: "379800" });

    expect(row?.quantity).toBe(50);
    expect(hasHolding(updated, { accountId: "pension-future", symbol: "379800" })).toBe(true);
    expect(hasHolding(deleted, { accountId: "pension-future", symbol: "379800" })).toBe(false);
  });

  it("applies a fetched market quote to every matching holding", () => {
    const updated = updateHoldingPrice(holdings, {
      symbol: "379800",
      price: 25000,
      currency: "KRW",
      updatedAt: "2026-09-04",
      source: "NAVER Finance",
    });
    const matchingRows = updated.filter((holding) => holding.symbol === "379800");

    expect(matchingRows.every((holding) => holding.currentPrice === 25000)).toBe(true);
    expect(matchingRows.every((holding) => holding.priceSource === "NAVER Finance")).toBe(true);
  });
});
