import { Banknote } from "lucide-react";
import { formatKrw, formatNumber } from "../format";
import type { Account, AccountId, CashPosition, Currency, ExchangeRates } from "../types";

const currencies: readonly Currency[] = ["KRW", "USD"];

const cashAmount = (
  cashPositions: readonly CashPosition[],
  accountId: AccountId,
  currency: Currency,
): number => cashPositions.find((cash) => cash.accountId === accountId && cash.currency === currency)?.amount ?? 0;

const toKrw = (amount: number, currency: Currency, exchangeRates: ExchangeRates): number => amount * exchangeRates[currency];
const cashInputValue = (value: string): number => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};

export function CashPositionEditor({
  accounts,
  activeAccount,
  cashPositions,
  exchangeRates,
  onUpdateCashPosition,
}: {
  readonly accounts: readonly Account[];
  readonly activeAccount: AccountId | "all";
  readonly cashPositions: readonly CashPosition[];
  readonly exchangeRates: ExchangeRates;
  readonly onUpdateCashPosition: (update: CashPosition) => void;
}) {
  const visibleAccounts =
    activeAccount === "all" ? accounts : accounts.filter((account) => account.id === activeAccount);

  return (
    <div className="cash-editor" aria-label="현금 보유액">
      <div className="cash-editor-heading">
        <Banknote size={18} aria-hidden="true" />
        <strong>현금 보유액</strong>
      </div>
      <div className="cash-editor-grid">
        {visibleAccounts.map((account) => {
          const krwAmount = cashAmount(cashPositions, account.id, "KRW");
          const usdAmount = cashAmount(cashPositions, account.id, "USD");
          const totalValue = toKrw(krwAmount, "KRW", exchangeRates) + toKrw(usdAmount, "USD", exchangeRates);

          return (
            <div className="cash-row" key={account.id}>
              <div className="cash-account">
                <strong>{account.name}</strong>
                <span>{account.broker}</span>
              </div>
              {currencies.map((currency) => (
                <label className="cash-field" key={`${account.id}-${currency}`}>
                  <span>{currency}</span>
                  <input
                    inputMode="decimal"
                    min="0"
                    step={currency === "KRW" ? "1" : "0.01"}
                    type="number"
                    value={cashAmount(cashPositions, account.id, currency)}
                    onChange={(event) =>
                      onUpdateCashPosition({
                        accountId: account.id,
                        currency,
                        amount: cashInputValue(event.currentTarget.value),
                      })
                    }
                  />
                </label>
              ))}
              <div className="cash-total">
                <span>원화 환산</span>
                <strong>{formatKrw(totalValue)}</strong>
                <small>USD {formatNumber(exchangeRates.USD)}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
