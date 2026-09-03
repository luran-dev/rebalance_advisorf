import { useMemo, useState } from "react";
import { addAccount, deleteAccount, updateAccount, type PortfolioState } from "./accountState";
import { buildAccountSnapshot, summarizeAssets } from "./calculations";
import { AccountManager } from "./components/AccountManager";
import { AllocationDonut } from "./components/AllocationDonut";
import { AppShellNav, type AppView, type PortfolioView } from "./components/AppShellNav";
import { HoldingsTable } from "./components/HoldingsTable";
import { MetricTile } from "./components/MetricTile";
import { StrategyTable } from "./components/StrategyTable";
import { accounts, cashPositions, holdings, targetAssets } from "./data";
import { formatKrw, formatPercent } from "./format";
import type { AccountDraft, AccountId, SymbolCode, TargetAsset } from "./types";

const updateTargetPercent = (
  targets: readonly TargetAsset[],
  accountId: AccountId,
  symbol: SymbolCode,
  targetPercent: number,
): readonly TargetAsset[] =>
  targets.map((target) =>
    target.accountId === accountId && target.symbol === symbol ? { ...target, targetPercent } : target,
  );

export function App() {
  const [activeView, setActiveView] = useState<AppView>("all");
  const [portfolio, setPortfolio] = useState<PortfolioState>({
    accounts,
    targets: targetAssets,
    holdings,
    cashPositions,
  });
  const activeAccount: PortfolioView = activeView === "accounts" ? "all" : activeView;
  const snapshot = useMemo(
    () =>
      buildAccountSnapshot(
        portfolio.holdings,
        portfolio.targets,
        portfolio.cashPositions,
        activeAccount === "all" ? undefined : activeAccount,
      ),
    [activeAccount, portfolio],
  );
  const summary = useMemo(() => summarizeAssets(snapshot.rows, snapshot.cashValue), [snapshot]);
  const selectedName = activeAccount === "all" ? "전체 포트폴리오" : portfolio.accounts.find((account) => account.id === activeAccount)?.name ?? activeAccount;
  const driftCount = snapshot.rows.filter((row) => row.direction !== "hold").length;
  const addManagedAccount = (draft: AccountDraft) => setPortfolio((current) => addAccount(current, draft));
  const updateManagedAccount = (accountId: AccountId, draft: AccountDraft) =>
    setPortfolio((current) => updateAccount(current, accountId, draft));
  const deleteManagedAccount = (accountId: AccountId) => {
    setPortfolio((current) => deleteAccount(current, accountId));
    setActiveView((current) => (current === accountId ? "all" : current));
  };

  return (
    <div className="app-shell">
      <AppShellNav accounts={portfolio.accounts} activeView={activeView} onViewChange={setActiveView} />
      <main className="main-content">
        {activeView === "accounts" ? (
          <section className="metadata-view" aria-label="계좌 메타 정보">
            <header className="topbar">
              <div>
                <p className="eyebrow">Portfolio metadata</p>
                <h1>계좌 관리</h1>
              </div>
              <div className="summary-chip">{portfolio.accounts.length}개 계좌</div>
            </header>
            <AccountManager
              accounts={portfolio.accounts}
              activeAccount={activeAccount}
              onAddAccount={addManagedAccount}
              onUpdateAccount={updateManagedAccount}
              onDeleteAccount={deleteManagedAccount}
            />
          </section>
        ) : (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Google Sheets workflow migration</p>
                <h1>{selectedName} 리밸런싱</h1>
              </div>
              <div className="summary-chip">{driftCount}개 조정 필요</div>
            </header>
            <section className="metric-grid" aria-label="포트폴리오 핵심 지표">
              <MetricTile label="매입 금액" value={formatKrw(snapshot.investedValue)} />
              <MetricTile label="평가 금액" value={formatKrw(snapshot.marketValue)} />
              <MetricTile label="수익률" value={formatPercent(snapshot.returnPercent)} tone={snapshot.returnPercent >= 0 ? "gain" : "loss"} />
              <MetricTile label="현금" value={formatKrw(snapshot.cashValue)} tone="warning" />
            </section>
            <div className="analysis-grid">
              <AllocationDonut summary={summary} />
              <StrategyTable
                accounts={portfolio.accounts}
                activeAccount={activeAccount}
                targets={portfolio.targets}
                onTargetPercentChange={(accountId, symbol, targetPercent) =>
                  setPortfolio((current) => ({
                    ...current,
                    targets: updateTargetPercent(current.targets, accountId, symbol, targetPercent),
                  }))
                }
              />
            </div>
            <HoldingsTable accounts={portfolio.accounts} rows={snapshot.rows} />
          </>
        )}
      </main>
    </div>
  );
}
