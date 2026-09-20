import { LogOut } from "lucide-react";

export function AppTopbar({
  eyebrow,
  title,
  summary,
  onLogout,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly onLogout: () => Promise<void>;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="summary-chip">{summary}</div>
        <button
          aria-label="로그아웃"
          className="topbar-logout"
          onClick={() => void onLogout()}
          title="로그아웃"
          type="button"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
