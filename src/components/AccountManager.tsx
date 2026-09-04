import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Account, AccountDraft, AccountId } from "../types";
import { AccountDialog, type AccountDialogState } from "./AccountDialog";

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
  const [dialogState, setDialogState] = useState<AccountDialogState | null>(null);

  return (
    <section className="panel account-manager">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">계좌 관리</p>
          <h2>계좌 추가/수정/삭제</h2>
        </div>
        <button className="command command-primary" type="button" onClick={() => setDialogState({ kind: "add" })}>
          <Plus size={16} aria-hidden="true" />
          새 계좌 추가
        </button>
      </div>
      <div className="account-manager-body">
        <div className="account-list" aria-label="등록된 계좌">
          {accounts.map((account) => (
            <article className={activeAccount === account.id ? "account-row selected" : "account-row"} key={account.id}>
              <div>
                <strong>{account.name}</strong>
                <span>{account.broker}</span>
              </div>
              <div className="row-actions">
                <button
                  className="icon-command icon-only"
                  type="button"
                  onClick={() => setDialogState({ kind: "edit", account })}
                  aria-label={`${account.name} 계좌 수정`}
                  title="수정"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  className="icon-command icon-only danger"
                  type="button"
                  onClick={() => onDeleteAccount(account.id)}
                  aria-label={`${account.name} 계좌 삭제`}
                  title="삭제"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      {dialogState !== null ? (
        <AccountDialog
          state={dialogState}
          onClose={() => setDialogState(null)}
          onAddAccount={onAddAccount}
          onUpdateAccount={onUpdateAccount}
        />
      ) : null}
    </section>
  );
}
