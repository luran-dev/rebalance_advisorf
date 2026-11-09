import { LogOut } from "lucide-react";

export function AppTopbar({
  eyebrow,
  title,
  summary,
  lastSavedAt,
  onLogout,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly lastSavedAt?: Date | null;
  readonly onLogout: () => Promise<void>;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        {lastSavedAt !== undefined ? (
          <span className="last-saved-at" aria-live="polite">
            최근 저장 {lastSavedAt === null ? "확인 전" : (
              <time dateTime={lastSavedAt.toISOString()}>
                {lastSavedAt.toLocaleString("ko-KR", {
                  year: "numeric", month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
                })}
              </time>
            )}
          </span>
        ) : null}
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
