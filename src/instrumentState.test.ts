import { describe, expect, it } from "vitest";
import {
  addInstrument,
  deleteInstrument,
  hasInstrumentSymbol,
  updateInstrument,
  updateInstrumentFx,
  updateInstrumentPrice,
} from "./instrumentState";
import type { Instrument } from "./types";

const instruments: readonly Instrument[] = [
  { name: "KODEX 미국 S&P500 TR", symbol: "379800", country: "한국", currency: "KRW", category: "S&P500" },
  { name: "Invesco QQQ Trust", symbol: "QQQ", country: "미국", currency: "USD", category: "해외 ETF" },
];

describe("instrument state management", () => {
  it("adds an instrument with trimmed fields and a normalized symbol", () => {
    const next = addInstrument(instruments, {
      name: "  iShares Gold Trust  ",
      symbol: " iau ",
      country: "미국",
      currency: "USD",
      category: "금",
    });

    expect(next.at(-1)).toEqual({
      name: "iShares Gold Trust",
      symbol: "IAU",
      country: "미국",
      currency: "USD",
      category: "금",
    });
  });

  it("updates instrument metadata by its current symbol", () => {
    const next = updateInstrument(instruments, "QQQ", {
      name: "Invesco NASDAQ 100 ETF",
      symbol: "qqqm",
      country: "미국",
      currency: "USD",
      category: "나스닥100",
    });

    expect(next.find((instrument) => instrument.symbol === "QQQM")).toEqual({
      name: "Invesco NASDAQ 100 ETF",
      symbol: "QQQM",
      country: "미국",
      currency: "USD",
      category: "나스닥100",
    });
  });

  it("detects duplicate symbols while allowing the currently edited symbol", () => {
    expect(hasInstrumentSymbol(instruments, " qqq ")).toBe(true);
    expect(hasInstrumentSymbol(instruments, " qqq ", "QQQ")).toBe(false);
  });

  it("deletes an instrument without changing unrelated metadata", () => {
    const next = deleteInstrument(instruments, "QQQ");

    expect(next).toEqual([
      { name: "KODEX 미국 S&P500 TR", symbol: "379800", country: "한국", currency: "KRW", category: "S&P500" },
    ]);
  });

  it("applies fetched price metadata to the matching instrument", () => {
    const next = updateInstrumentPrice(instruments, {
      symbol: "QQQ",
      price: 703.41,
      currency: "USD",
      updatedAt: "2026-09-02",
      source: "Nasdaq ETF",
    });

    expect(next.find((instrument) => instrument.symbol === "QQQ")).toMatchObject({
      price: 703.41,
      priceUpdatedAt: "2026-09-02",
      priceSource: "Nasdaq ETF",
    });
  });

  it("applies fetched fx metadata to instruments with the same currency", () => {
    const next = updateInstrumentFx(instruments, {
      source: "ECB reference rate",
      currency: "USD",
      quote: "KRW",
      rate: 1362.5583,
      date: "2026-09-02",
    });

    expect(next.find((instrument) => instrument.symbol === "QQQ")).toMatchObject({
      fxRate: 1362.5583,
      fxUpdatedAt: "2026-09-02",
      fxSource: "ECB reference rate",
    });
    expect(next.find((instrument) => instrument.symbol === "379800")?.fxRate).toBeUndefined();
  });
});
