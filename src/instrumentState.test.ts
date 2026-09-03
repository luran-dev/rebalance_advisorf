import { describe, expect, it } from "vitest";
import { addInstrument, deleteInstrument, hasInstrumentSymbol, updateInstrument } from "./instrumentState";
import type { Instrument } from "./types";

const instruments: readonly Instrument[] = [
  { name: "KODEX 미국 S&P500 TR", symbol: "379800", currency: "KRW", category: "S&P500" },
  { name: "Invesco QQQ Trust", symbol: "QQQ", currency: "USD", category: "해외 ETF" },
];

describe("instrument state management", () => {
  it("adds an instrument with trimmed fields and a normalized symbol", () => {
    const next = addInstrument(instruments, {
      name: "  iShares Gold Trust  ",
      symbol: " iau ",
      currency: "USD",
      category: "금",
    });

    expect(next.at(-1)).toEqual({
      name: "iShares Gold Trust",
      symbol: "IAU",
      currency: "USD",
      category: "금",
    });
  });

  it("updates instrument metadata by its current symbol", () => {
    const next = updateInstrument(instruments, "QQQ", {
      name: "Invesco NASDAQ 100 ETF",
      symbol: "qqqm",
      currency: "USD",
      category: "나스닥100",
    });

    expect(next.find((instrument) => instrument.symbol === "QQQM")).toEqual({
      name: "Invesco NASDAQ 100 ETF",
      symbol: "QQQM",
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

    expect(next).toEqual([{ name: "KODEX 미국 S&P500 TR", symbol: "379800", currency: "KRW", category: "S&P500" }]);
  });
});
