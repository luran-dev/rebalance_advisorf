import { describe, expect, it } from "vitest";
import {
  addAccount,
  deleteAccount,
  setCashPosition,
  updateAccount,
  updateAccountsDefaultFx,
  type PortfolioState,
} from "./accountState";
import { accounts, cashPositions, holdings, instruments, targetAssets } from "./data";

const baseState: PortfolioState = {
  accounts,
  instruments,
  targets: targetAssets,
  holdings,
  cashPositions,
};

describe("account state management", () => {
  it("adds an account with a stable unique id", () => {
    const next = addAccount(baseState, { name: "ISA", broker: "미래" });

    expect(next.accounts.at(-1)).toEqual({ id: "isa", name: "ISA", broker: "미래" });
  });

  it("updates account labels without changing portfolio positions", () => {
    const next = updateAccount(baseState, "irp-future", { name: "퇴직연금 IRP", broker: "미래증권" });

    expect(next.accounts.find((account) => account.id === "irp-future")).toEqual({
      id: "irp-future",
      name: "퇴직연금 IRP",
      broker: "미래증권",
    });
    expect(next.holdings.length).toBe(baseState.holdings.length);
  });

  it("deletes an account and cascades dependent portfolio data", () => {
    const next = deleteAccount(baseState, "irp-future");

    expect(next.accounts.some((account) => account.id === "irp-future")).toBe(false);
    expect(next.targets.some((target) => target.accountId === "irp-future")).toBe(false);
    expect(next.holdings.some((holding) => holding.accountId === "irp-future")).toBe(false);
    expect(next.cashPositions.some((cash) => cash.accountId === "irp-future")).toBe(false);
  });

  it("stores default fx on accounts when a foreign currency is refreshed", () => {
    const next = updateAccountsDefaultFx(accounts, "USD", 1362.5583);

    expect(next.every((account) => account.defaultFx === 1362.5583)).toBe(true);
  });

  it("records KRW and USD cash balances per account", () => {
    const withKrw = setCashPosition(baseState, { accountId: "global-shinhan", currency: "KRW", amount: 1_200_000 });
    const withUsd = setCashPosition(withKrw, { accountId: "global-shinhan", currency: "USD", amount: 320.5 });

    expect(withUsd.cashPositions).toEqual(
      expect.arrayContaining([
        { accountId: "global-shinhan", currency: "KRW", amount: 1_200_000 },
        { accountId: "global-shinhan", currency: "USD", amount: 320.5 },
      ]),
    );
  });
});
