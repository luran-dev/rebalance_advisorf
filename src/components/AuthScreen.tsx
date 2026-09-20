import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, login, register, type AuthSession } from "../appApi";
import { PortfolioBackupError } from "../portfolioBackup";
import { PasswordResetFlow } from "./PasswordResetFlow";

type AuthMode = "login" | "register" | "reset";

export function AuthScreen({ onAuthenticated }: { readonly onAuthenticated: (session: AuthSession) => Promise<void> }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (mode !== "reset") {
      headingRef.current?.focus();
    }
  }, [mode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    if (typeof email !== "string" || typeof password !== "string") {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      setIsSubmitting(false);
      return;
    }
    try {
      const session = await (mode === "login" ? login({ email, password }) : register({ email, password }));
      await onAuthenticated(session);
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
      } else if (error instanceof PortfolioBackupError) {
        setMessage(`기존 브라우저 데이터 이전 실패: ${error.message}`);
      } else if (error instanceof Error) {
        setMessage("서버에 연결하지 못했습니다.");
      } else {
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="brand-mark auth-brand" aria-hidden="true">RA</div>
        {mode === "reset" ? (
          <PasswordResetFlow
            onCancel={() => setMode("login")}
            onComplete={() => {
              setMode("login");
              setMessage("비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요.");
            }}
          />
        ) : (
          <>
            <p className="eyebrow">Rebalance Advisor</p>
            <h1 id="auth-title" ref={headingRef} tabIndex={-1}>{mode === "login" ? "로그인" : "이메일로 가입"}</h1>
            <div className="auth-mode" role="group" aria-label="인증 방식">
              <button aria-pressed={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">로그인</button>
              <button aria-pressed={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">가입</button>
            </div>
            <form className="auth-form" onSubmit={submit}>
              <label>
                이메일
                <input autoComplete="email" name="email" required type="email" />
              </label>
              <label>
                비밀번호
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </label>
              <button className="command command-primary auth-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? "처리 중" : mode === "login" ? "로그인" : "가입하고 시작"}
              </button>
            </form>
            {mode === "login" ? (
              <button className="auth-link" onClick={() => { setMessage(""); setMode("reset"); }} type="button">
                비밀번호를 잊으셨나요?
              </button>
            ) : null}
            <p className="auth-message" aria-live="polite">{message}</p>
          </>
        )}
      </section>
    </main>
  );
}
