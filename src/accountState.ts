import type { Account, AccountDraft, AccountId, CashPosition, Currency, Holding, Instrument, TargetAsset } from "./types";

export type PortfolioState = {
  readonly accounts: readonly Account[];
  readonly instruments: readonly Instrument[];
  readonly targets: readonly TargetAsset[];
  readonly holdings: readonly Holding[];
  readonly cashPositions: readonly CashPosition[];
};

export type CashPositionUpdate = {
  readonly accountId: AccountId;
  readonly currency: Currency;
  readonly amount: number;
};

export const accountIdFromDraft = (draft: AccountDraft, existingAccounts: readonly Account[]): AccountId => {
  const base = draft.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
  const prefix = base.length > 0 ? base : "account";
  let suffix = 1;
  let candidate = prefix;

  while (existingAccounts.some((account) => account.id === candidate)) {
    suffix += 1;
    candidate = `${prefix}-${suffix}`;
  }

  return candidate;
};

export const addAccount = (state: PortfolioState, draft: AccountDraft): PortfolioState => ({
  ...state,
  accounts: [...state.accounts, { id: accountIdFromDraft(draft, state.accounts), ...draft }],
});

export const updateAccount = (state: PortfolioState, accountId: AccountId, draft: AccountDraft): PortfolioState => ({
  ...state,
  accounts: state.accounts.map((account) => (account.id === accountId ? { ...account, ...draft } : account)),
});

export const deleteAccount = (state: PortfolioState, accountId: AccountId): PortfolioState => ({
  instruments: state.instruments,
  accounts: state.accounts.filter((account) => account.id !== accountId),
  targets: state.targets.filter((target) => target.accountId !== accountId),
  holdings: state.holdings.filter((holding) => holding.accountId !== accountId),
  cashPositions: state.cashPositions.filter((cash) => cash.accountId !== accountId),
});

export const setCashPosition = (state: PortfolioState, update: CashPositionUpdate): PortfolioState => {
  const nextCash = { accountId: update.accountId, currency: update.currency, amount: update.amount };
  const hasCash = state.cashPositions.some(
    (cash) => cash.accountId === update.accountId && cash.currency === update.currency,
  );

  return {
    ...state,
    cashPositions: hasCash
      ? state.cashPositions.map((cash) =>
          cash.accountId === update.accountId && cash.currency === update.currency ? nextCash : cash,
        )
      : [...state.cashPositions, nextCash],
  };
};

export const updateAccountsDefaultFx = (
  accounts: readonly Account[],
  currency: Currency,
  rate: number,
): readonly Account[] =>
  currency === "KRW" ? accounts : accounts.map((account) => ({ ...account, defaultFx: rate }));
