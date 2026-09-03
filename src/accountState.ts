import type { Account, AccountDraft, AccountId, CashPosition, Holding, TargetAsset } from "./types";

export type PortfolioState = {
  readonly accounts: readonly Account[];
  readonly targets: readonly TargetAsset[];
  readonly holdings: readonly Holding[];
  readonly cashPositions: readonly CashPosition[];
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
  accounts: state.accounts.filter((account) => account.id !== accountId),
  targets: state.targets.filter((target) => target.accountId !== accountId),
  holdings: state.holdings.filter((holding) => holding.accountId !== accountId),
  cashPositions: state.cashPositions.filter((cash) => cash.accountId !== accountId),
});
