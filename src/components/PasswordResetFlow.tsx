import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, completePasswordReset, requestPasswordReset, verifyPasswordReset } from "../appApi";

type ResetStep =
  | { readonly kind: "request" }
  | { readonly kind: "verify"; readonly email: string }
  | { readonly kind: "complete"; readonly resetToken: string };

export function PasswordResetFlow({
  onCancel,
  onComplete,
}: {
  readonly onCancel: () => void;
  readonly onComplete: () => void;
}) {
  const [step, setStep] = useState<ResetStep>({ kind: "request" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step.kind]);

  const run = async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message);
      } else if (error instanceof Error) {
        setMessage("서버에 연결하지 못했습니다.");
      } else {
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    if (typeof email !== "string") return;
    void run(async () => {
      await requestPasswordReset(email);
      setStep({ kind: "verify", email });
    });
  };

  const verifyCode = (event: FormEvent<HTMLFormElement>, email: string) => {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get("code");
    if (typeof code !== "string") return;
    void run(async () => {
      const resetToken = await verifyPasswordReset(email, code);
      setStep({ kind: "complete", resetToken });
    });
  };

  const changePassword = (event: FormEvent<HTMLFormElement>, resetToken: string) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = form.get("password");
    const confirmation = form.get("confirmation");
    if (typeof password !== "string" || typeof confirmation !== "string") return;
    if (password !== confirmation) {
      setMessage("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    void run(async () => {
      await completePasswordReset(resetToken, password);
      onComplete();
    });
  };

  return (
    <>
      <p className="eyebrow">Password recovery</p>
      <h1 id="auth-title" ref={headingRef} tabIndex={-1}>
        {step.kind === "request" ? "비밀번호 찾기" : step.kind === "verify" ? "인증 코드 확인" : "새 비밀번호 설정"}
      </h1>
      {step.kind === "request" ? (
        <form className="auth-form" onSubmit={requestCode}>
          <label>가입 이메일<input autoComplete="email" name="email" required type="email" /></label>
          <button className="command command-primary auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "발송 중" : "인증 코드 받기"}
          </button>
        </form>
      ) : step.kind === "verify" ? (
        <form className="auth-form" onSubmit={(event) => verifyCode(event, step.email)}>
          <p className="auth-description">{step.email}로 전송된 6자리 코드를 입력하세요.</p>
          <label>인증 코드<input autoComplete="one-time-code" inputMode="numeric" maxLength={6} name="code" pattern="[0-9]{6}" required /></label>
          <button className="command command-primary auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "확인 중" : "인증 코드 확인"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={(event) => changePassword(event, step.resetToken)}>
          <label>새 비밀번호<input autoComplete="new-password" minLength={8} name="password" required type="password" /></label>
          <label>새 비밀번호 확인<input autoComplete="new-password" minLength={8} name="confirmation" required type="password" /></label>
          <button className="command command-primary auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "변경 중" : "비밀번호 변경"}
          </button>
        </form>
      )}
      <p className="auth-message" aria-live="polite">{message}</p>
      <button className="auth-link" onClick={onCancel} type="button">로그인으로 돌아가기</button>
    </>
  );
}
