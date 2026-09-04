import { useMemo, useState } from "react";
import { addAccount, deleteAccount, updateAccount, type PortfolioState } from "./accountState";
import { buildAccountSnapshot, summarizeAssets } from "./calculations";
import { AccountManager } from "./components/AccountManager";
import { AllocationDonut } from "./components/AllocationDonut";
import { AppShellNav, type AppView, type PortfolioView } from "./components/AppShellNav";
import { HoldingsTable } from "./components/HoldingsTable";
import { InstrumentManager } from "./components/InstrumentManager";
import { MetricTile } from "./components/MetricTile";
import { ResizableAnalysisGrid } from "./components/ResizableAnalysisGrid";
import { StrategyTable } from "./components/StrategyTable";
import { accounts, cashPositions, holdings, instruments, targetAssets } from "./data";
import { formatKrw, formatPercent } from "./format";
import { addHolding, deleteHolding, updateHolding, type HoldingSelection, type HoldingUpdate } from "./holdingState";
import { addInstrument, deleteInstrument, updateInstrument } from "./instrumentState";
import { addTargetAllocation, deleteTargetAllocation, updateTargetAllocation } from "./targetAllocationState";
import { usePortfolioRefresh } from "./usePortfolioRefresh";
import type {
  AccountDraft,
  AccountId,
  HoldingKey,
  Instrument,
  InstrumentDraft,
  SymbolCode,
  TargetAllocationDraft,
  TargetAllocationKey,
} from "./types";

export function App() {
  const [activeView, setActiveView] = useState<AppView>("all");
  const [portfolio, setPortfolio] = useState<PortfolioState>({
    accounts,
    instruments,
    targets: targetAssets,
    holdings,
    cashPositions,
  });
  const [allocationPanelPercent, setAllocationPanelPercent] = useState(38);
  const { exchangeRates, priceRefresh, fxRefresh, refreshVisibleHoldingPrices, refreshExchangeRates } =
    usePortfolioRefresh({ portfolio, setPortfolio });
  const activeAccount: PortfolioView = activeView === "accounts" || activeView === "instruments" ? "all" : activeView;
  const snapshot = useMemo(
    () =>
      buildAccountSnapshot(
        portfolio.holdings,
        portfolio.targets,
        portfolio.cashPositions,
        activeAccount === "all" ? undefined : activeAccount,
        exchangeRates,
      ),
    [activeAccount, exchangeRates, portfolio],
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
  const addManagedInstrument = (draft: InstrumentDraft) =>
    setPortfolio((current) => ({ ...current, instruments: addInstrument(current.instruments, draft) }));
  const updateManagedInstrument = (symbol: SymbolCode, draft: InstrumentDraft) =>
    setPortfolio((current) => ({ ...current, instruments: updateInstrument(current.instruments, symbol, draft) }));
  const deleteManagedInstrument = (symbol: SymbolCode) =>
    setPortfolio((current) => ({ ...current, instruments: deleteInstrument(current.instruments, symbol) }));
  const addManagedTargetAllocation = (draft: TargetAllocationDraft, instrument: Instrument) =>
    setPortfolio((current) => ({ ...current, targets: addTargetAllocation(current.targets, draft, instrument) }));
  const updateManagedTargetAllocation = (
    key: TargetAllocationKey,
    draft: TargetAllocationDraft,
    instrument: Instrument,
  ) =>
    setPortfolio((current) => ({
      ...current,
      targets: updateTargetAllocation({ targets: current.targets, currentKey: key, draft, instrument }),
    }));
  const deleteManagedTargetAllocation = (key: TargetAllocationKey) =>
    setPortfolio((current) => ({ ...current, targets: deleteTargetAllocation(current.targets, key) }));
  const addManagedHolding = (holding: HoldingSelection) =>
    setPortfolio((current) => ({
      ...current,
      holdings: addHolding(current.holdings, holding),
    }));
  const updateManagedHolding = (holding: HoldingUpdate) =>
    setPortfolio((current) => ({
      ...current,
      holdings: updateHolding({
        holdings: current.holdings,
        currentKey: holding.key,
        draft: holding.draft,
        target: holding.target,
        instrument: holding.instrument,
      }),
    }));
  const deleteManagedHolding = (key: HoldingKey) =>
    setPortfolio((current) => ({ ...current, holdings: deleteHolding(current.holdings, key) }));

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
        ) : activeView === "instruments" ? (
          <section className="metadata-view" aria-label="종목 메타 정보">
            <header className="topbar">
              <div>
                <p className="eyebrow">Portfolio metadata</p>
                <h1>종목 관리</h1>
              </div>
              <div className="summary-chip">{portfolio.instruments.length}개 종목</div>
            </header>
            <InstrumentManager
              instruments={portfolio.instruments}
              onAddInstrument={addManagedInstrument}
              onUpdateInstrument={updateManagedInstrument}
              onDeleteInstrument={deleteManagedInstrument}
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
            <ResizableAnalysisGrid
              allocationPercent={allocationPanelPercent}
              onAllocationPercentChange={setAllocationPanelPercent}
              allocationPanel={<AllocationDonut summary={summary} />}
              strategyPanel={
                <StrategyTable
                  accounts={portfolio.accounts}
                  activeAccount={activeAccount}
                  instruments={portfolio.instruments}
                  targets={portfolio.targets}
                  onAddTargetAllocation={addManagedTargetAllocation}
                  onUpdateTargetAllocation={updateManagedTargetAllocation}
                  onDeleteTargetAllocation={deleteManagedTargetAllocation}
                />
              }
            />
            <HoldingsTable
              accounts={portfolio.accounts}
              activeAccount={activeAccount}
              rows={snapshot.rows}
              instruments={portfolio.instruments}
              targets={portfolio.targets}
              isRefreshingPrices={priceRefresh.isRunning}
              priceRefreshStatus={priceRefresh.message}
              isRefreshingFx={fxRefresh.isRunning}
              fxRefreshStatus={fxRefresh.message}
              onRefreshPrices={refreshVisibleHoldingPrices}
              onRefreshFx={refreshExchangeRates}
              onAddHolding={addManagedHolding}
              onUpdateHolding={updateManagedHolding}
              onDeleteHolding={deleteManagedHolding}
            />
          </>
        )}
      </main>
    </div>
  );
}
