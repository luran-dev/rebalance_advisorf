import { describe, expect, it } from "vitest";
import {
  addTargetAllocation,
  deleteTargetAllocation,
  hasTargetAllocation,
  sumTargetPercent,
  updateTargetAllocation,
} from "./targetAllocationState";
import type { Instrument, TargetAsset } from "./types";

const qqq: Instrument = {
  name: "Invesco QQQ Trust",
  symbol: "QQQ",
  country: "미국",
  currency: "USD",
  category: "해외 ETF",
};

const targets: readonly TargetAsset[] = [
  {
    accountId: "global-shinhan",
    assetClass: "해외 ETF",
    symbol: "QQQ",
    productName: "Invesco QQQ Trust",
    suitability: "일반",
    targetPercent: 20,
  },
];

describe("target allocation state management", () => {
  it("adds a target allocation from selected instrument metadata", () => {
    const next = addTargetAllocation(
      [],
      { accountId: "global-shinhan", symbol: "QQQ", suitability: "일반", targetPercent: 25 },
      qqq,
    );

    expect(next).toEqual([
      {
        accountId: "global-shinhan",
        assetClass: "해외 ETF",
        symbol: "QQQ",
        productName: "Invesco QQQ Trust",
        suitability: "일반",
        targetPercent: 25,
      },
    ]);
  });

  it("updates a target allocation and keeps name and asset class synced to the instrument", () => {
    const updatedInstrument: Instrument = { ...qqq, name: "NASDAQ 100 ETF", category: "나스닥100" };
    const next = updateTargetAllocation({
      targets,
      currentKey: { accountId: "global-shinhan", symbol: "QQQ" },
      draft: { accountId: "global-shinhan", symbol: "QQQ", suitability: "일반", targetPercent: 30 },
      instrument: updatedInstrument,
    });

    expect(next[0]).toEqual({
      accountId: "global-shinhan",
      assetClass: "나스닥100",
      symbol: "QQQ",
      productName: "NASDAQ 100 ETF",
      suitability: "일반",
      targetPercent: 30,
    });
  });

  it("detects duplicate account and symbol pairs while allowing the edited row", () => {
    const key = { accountId: "global-shinhan", symbol: "QQQ" };

    expect(hasTargetAllocation(targets, key)).toBe(true);
    expect(hasTargetAllocation(targets, key, key)).toBe(false);
  });

  it("sums target percentages for one account", () => {
    expect(sumTargetPercent(targets, "global-shinhan")).toBe(20);
  });

  it("deletes a target allocation by account and symbol", () => {
    expect(deleteTargetAllocation(targets, { accountId: "global-shinhan", symbol: "QQQ" })).toEqual([]);
  });
});
