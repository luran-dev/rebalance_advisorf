import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Account, AccountDraft, AccountId } from "../types";

const emptyDraft: AccountDraft = {
  name: "",
  broker: "",
};

export function AccountManager({
  accounts,
  activeAccount,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}: {
  readonly accounts: readonly Account[];
  readonly activeAccount: AccountId | "all";
  readonly onAddAccount: (draft: AccountDraft) => void;
  readonly onUpdateAccount: (accountId: AccountId, draft: AccountDraft) => void;
  readonly onDeleteAccount: (accountId: AccountId) => void;
}) {
  const [draft, setDraft] = useState<AccountDraft>(emptyDraft);
  const [editingAccountId, setEditingAccountId] = useState<AccountId | null>(null);
  const isEditing = editingAccountId !== null;
  const canSubmit = draft.name.trim().length > 0 && draft.broker.trim().length > 0;

  const submit = () => {
    if (!canSubmit) {
      return;
    }
    if (editingAccountId === null) {
      onAddAccount({ name: draft.name.trim(), broker: draft.broker.trim() });
    } else {
      onUpdateAccount(editingAccountId, { name: draft.name.trim(), broker: draft.broker.trim() });
    }
    setDraft(emptyDraft);
    setEditingAccountId(null);
  };

  return (
    <section className="panel account-manager">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">계좌 관리</p>
          <h2>계좌 추가/수정/삭제</h2>
        </div>
        <Plus size={22} aria-hidden="true" />
      </div>
      <div className="account-manager-body">
        <div className="account-form" aria-label="계좌 입력">
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
          <button className="command command-primary" type="button" disabled={!canSubmit} onClick={submit}>
            {isEditing ? <Pencil size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {isEditing ? "저장" : "추가"}
          </button>
          <button
            className="command command-ghost"
            type="button"
            disabled={!isEditing}
            onClick={() => {
              setDraft(emptyDraft);
              setEditingAccountId(null);
            }}
          >
            <X size={16} aria-hidden="true" />
            취소
          </button>
        </div>
        <div className="account-list" aria-label="등록된 계좌">
          {accounts.map((account) => (
            <article className={activeAccount === account.id ? "account-row selected" : "account-row"} key={account.id}>
              <div>
                <strong>{account.name}</strong>
                <span>{account.broker}</span>
              </div>
              <div className="row-actions">
                <button
                  className="icon-command"
                  type="button"
                  onClick={() => {
                    setDraft({ name: account.name, broker: account.broker });
                    setEditingAccountId(account.id);
                  }}
                >
                  <Pencil size={16} aria-hidden="true" />
                  수정
                </button>
                <button
                  className="icon-command danger"
                  type="button"
                  onClick={() => {
                    onDeleteAccount(account.id);
                    if (editingAccountId === account.id) {
                      setDraft(emptyDraft);
                      setEditingAccountId(null);
                    }
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
