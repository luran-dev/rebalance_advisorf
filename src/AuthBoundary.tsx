import { useEffect, useState } from "react";
import { App } from "./App";
import { loadSession, logout, savePortfolioState, type AuthSession } from "./appApi";
import { AuthScreen } from "./components/AuthScreen";
import { portfolioSeed } from "./data";
import { clearLegacyPortfolioState, loadLegacyPortfolioState } from "./portfolioBackup";

type AuthState =
  | { readonly kind: "loading" }
  | { readonly kind: "anonymous" }
  | { readonly kind: "authenticated"; readonly session: AuthSession }
  | { readonly kind: "error" };

const assertNever = (value: never): never => {
  throw new Error(`Unexpected auth state: ${JSON.stringify(value)}`);
};

export function AuthBoundary() {
  const [state, setState] = useState<AuthState>({ kind: "loading" });

  const completeAuthentication = async (session: AuthSession): Promise<void> => {
    if (session.portfolio !== null) {
      clearLegacyPortfolioState();
      setState({ kind: "authenticated", session });
      return;
    }
    const legacy = loadLegacyPortfolioState();
    const portfolio = legacy ?? portfolioSeed;
    await savePortfolioState(portfolio);
    if (legacy !== null) {
      clearLegacyPortfolioState();
    }
    setState({ kind: "authenticated", session: { ...session, portfolio } });
  };

  useEffect(() => {
    let active = true;
    loadSession()
      .then((session) => {
        if (!active) return;
        return session === null ? setState({ kind: "anonymous" }) : completeAuthentication(session);
      })
      .catch((error: unknown) => {
        if (active && error instanceof Error) {
          setState({ kind: "error" });
        } else if (!(error instanceof Error)) {
          throw error;
        }
      });
    return () => {
      active = false;
    };
  }, []);

  switch (state.kind) {
    case "loading":
      return <main className="auth-page"><p className="auth-loading">데이터를 불러오는 중입니다.</p></main>;
    case "anonymous":
      return <AuthScreen onAuthenticated={completeAuthentication} />;
    case "authenticated":
      return (
        <App
          initialPortfolio={state.session.portfolio ?? portfolioSeed}
          onLogout={async () => {
            await logout();
            setState({ kind: "anonymous" });
          }}
          userEmail={state.session.email}
        />
      );
    case "error":
      return <main className="auth-page"><p className="auth-loading">서버에 연결하지 못했습니다. 페이지를 새로고침해주세요.</p></main>;
    default:
      return assertNever(state);
  }
}
