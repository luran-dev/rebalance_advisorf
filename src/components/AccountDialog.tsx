import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import type { Account, AccountDraft } from "../types";

export type AccountDialogState =
  | { readonly kind: "add" }
  | { readonly kind: "edit"; readonly account: Account };

const emptyDraft: AccountDraft = {
  name: "",
  broker: "",
};

export function AccountDialog({
  state,
  onClose,
  onAddAccount,
  onUpdateAccount,
}: {
  readonly state: AccountDialogState;
  readonly onClose: () => void;
  readonly onAddAccount: (draft: AccountDraft) => void;
  readonly onUpdateAccount: (accountId: string, draft: AccountDraft) => void;
}) {
  const [draft, setDraft] = useState<AccountDraft>(
    state.kind === "add" ? emptyDraft : { name: state.account.name, broker: state.account.broker },
  );
  const canSubmit = draft.name.trim().length > 0 && draft.broker.trim().length > 0;
  const submit = () => {
    if (!canSubmit) {
      return;
    }
    const nextDraft = { name: draft.name.trim(), broker: draft.broker.trim() };
    if (state.kind === "add") {
      onAddAccount(nextDraft);
    } else {
      onUpdateAccount(state.account.id, nextDraft);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="panel target-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">계좌 관리</p>
            <h2 id="account-dialog-title">{state.kind === "add" ? "계좌 추가" : "계좌 수정"}</h2>
          </div>
          <button className="icon-command" type="button" onClick={onClose} aria-label="계좌 팝업 닫기">
            <X size={16} aria-hidden="true" />
            닫기
          </button>
        </div>
        <div className="target-editor" aria-label="계좌 입력">
          <label>
            계좌 이름
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })}
            />
          </label>
          <label>
            증권사
            <input
              type="text"
              value={draft.broker}
              onChange={(event) => setDraft({ ...draft, broker: event.currentTarget.value })}
            />
          </label>
          <div className="target-actions">
            <button className="command command-primary" type="button" disabled={!canSubmit} onClick={submit}>
              {state.kind === "add" ? <Plus size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
              {state.kind === "add" ? "추가" : "저장"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
