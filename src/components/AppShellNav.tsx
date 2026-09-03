import { BarChart3, Boxes, CircleDollarSign, Settings } from "lucide-react";
import type { Account, AccountId } from "../types";

export type PortfolioView = AccountId | "all";
export type AppView = PortfolioView | "accounts" | "instruments";

export function AppShellNav({
  accounts,
  activeView,
  onViewChange,
}: {
  readonly accounts: readonly Account[];
  readonly activeView: AppView;
  readonly onViewChange: (view: AppView) => void;
}) {
  return (
    <aside className="side-nav">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          RA
        </div>
        <div>
          <strong>Rebalance Advisor</strong>
          <span>투자 전략 관리</span>
        </div>
      </div>
      <nav aria-label="계좌 보기">
        <button
          aria-pressed={activeView === "all"}
          className={activeView === "all" ? "nav-item active" : "nav-item"}
          onClick={() => onViewChange("all")}
          type="button"
        >
          <BarChart3 size={18} aria-hidden="true" />
          전체 포트폴리오
        </button>
        {accounts.map((account) => (
          <button
            className={activeView === account.id ? "nav-item active" : "nav-item"}
            aria-pressed={activeView === account.id}
            key={account.id}
            onClick={() => onViewChange(account.id)}
            type="button"
          >
            <CircleDollarSign size={18} aria-hidden="true" />
            <span>{account.name}</span>
          </button>
        ))}
      </nav>
      <nav aria-label="메타 정보">
        <button
          aria-pressed={activeView === "accounts"}
          className={activeView === "accounts" ? "nav-item active" : "nav-item"}
          onClick={() => onViewChange("accounts")}
          type="button"
        >
          <Settings size={18} aria-hidden="true" />
          계좌 관리
        </button>
        <button
          aria-pressed={activeView === "instruments"}
          className={activeView === "instruments" ? "nav-item active" : "nav-item"}
          onClick={() => onViewChange("instruments")}
          type="button"
        >
          <Boxes size={18} aria-hidden="true" />
          종목 관리
        </button>
      </nav>
    </aside>
  );
}
