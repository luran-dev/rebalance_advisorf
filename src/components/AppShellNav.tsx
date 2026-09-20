import { BarChart3, Boxes, CircleDollarSign, DatabaseBackup, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import type { SaveStatus } from "../usePortfolioState";
import type { Account, AccountId } from "../types";

export type PortfolioView = AccountId | "all";
export type AppView = PortfolioView | "accounts" | "instruments" | "data";

export function AppShellNav({
  accounts,
  activeView,
  isCollapsed,
  userEmail,
  saveStatus,
  onLogout,
  onToggleCollapsed,
  onViewChange,
}: {
  readonly accounts: readonly Account[];
  readonly activeView: AppView;
  readonly isCollapsed: boolean;
  readonly userEmail: string;
  readonly saveStatus: SaveStatus;
  readonly onLogout: () => Promise<void>;
  readonly onToggleCollapsed: () => void;
  readonly onViewChange: (view: AppView) => void;
}) {
  const toggleLabel = isCollapsed ? "왼쪽 메뉴 펼치기" : "왼쪽 메뉴 접기";

  return (
    <aside className={isCollapsed ? "side-nav collapsed" : "side-nav"}>
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          RA
        </div>
        <div className="brand-copy">
          <strong>Rebalance Advisor</strong>
          <span>투자 전략 관리</span>
        </div>
        <button
          aria-label={toggleLabel}
          className="sidebar-toggle"
          onClick={onToggleCollapsed}
          title={toggleLabel}
          type="button"
        >
          {isCollapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
        </button>
      </div>
      <nav aria-label="계좌 보기">
        <button
          aria-label="전체 포트폴리오"
          aria-pressed={activeView === "all"}
          className={activeView === "all" ? "nav-item active" : "nav-item"}
          onClick={() => onViewChange("all")}
          title="전체 포트폴리오"
          type="button"
        >
          <BarChart3 size={18} aria-hidden="true" />
          <span className="nav-item-label">전체 포트폴리오</span>
        </button>
        {accounts.map((account) => (
          <button
            aria-label={account.name}
            aria-pressed={activeView === account.id}
            className={activeView === account.id ? "nav-item active" : "nav-item"}
            key={account.id}
            onClick={() => onViewChange(account.id)}
            title={account.name}
            type="button"
          >
            <CircleDollarSign size={18} aria-hidden="true" />
            <span className="nav-item-label">{account.name}</span>
          </button>
        ))}
      </nav>
      <nav aria-label="메타 정보">
        <button
          aria-label="계좌 관리"
          aria-pressed={activeView === "accounts"}
          className={activeView === "accounts" ? "nav-item active" : "nav-item"}
          onClick={() => onViewChange("accounts")}
          title="계좌 관리"
          type="button"
        >
          <Settings size={18} aria-hidden="true" />
          <span className="nav-item-label">계좌 관리</span>
        </button>
        <button
          aria-label="종목 관리"
          aria-pressed={activeView === "instruments"}
          className={activeView === "instruments" ? "nav-item active" : "nav-item"}
          onClick={() => onViewChange("instruments")}
          title="종목 관리"
          type="button"
        >
          <Boxes size={18} aria-hidden="true" />
          <span className="nav-item-label">종목 관리</span>
        </button>
        <button
          aria-label="데이터 관리"
          aria-pressed={activeView === "data"}
          className={activeView === "data" ? "nav-item active" : "nav-item"}
          onClick={() => onViewChange("data")}
          title="데이터 관리"
          type="button"
        >
          <DatabaseBackup size={18} aria-hidden="true" />
          <span className="nav-item-label">데이터 관리</span>
        </button>
      </nav>
      <div className="session-control">
        <div className="session-copy">
          <strong title={userEmail}>{userEmail}</strong>
          <span className={saveStatus === "error" ? "save-status error" : "save-status"} aria-live="polite">
            {saveStatus === "saved" ? "DB 저장 완료" : saveStatus === "saving" ? "DB 저장 중" : "DB 저장 실패"}
          </span>
        </div>
        <button aria-label="로그아웃" className="logout-button" onClick={() => void onLogout()} title="로그아웃" type="button">
          <LogOut size={18} aria-hidden="true" />
          <span className="nav-item-label">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
