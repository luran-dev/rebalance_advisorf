import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { hasHolding, type HoldingSelection, type HoldingUpdate } from "../holdingState";
import type { Account, HoldingDraft, HoldingRow, Instrument, TargetAsset } from "../types";
import { TargetAssetSearchField, type TargetSearchMode } from "./TargetAssetSearchField";

export type HoldingDialogState =
  | { readonly kind: "add"; readonly accountId: string }
  | { readonly kind: "edit"; readonly row: HoldingRow };

const emptyDraft = (accountId: string): HoldingDraft => ({
  accountId,
  symbol: "",
  currentPrice: 0,
  quantity: 0,
  averagePrice: 0,
});

export function HoldingDialog({
  state,
  accounts,
  holdings,
  instruments,
  targets,
  onClose,
  onAddHolding,
  onUpdateHolding,
}: {
  readonly state: HoldingDialogState;
  readonly accounts: readonly Account[];
  readonly holdings: readonly HoldingRow[];
  readonly instruments: readonly Instrument[];
  readonly targets: readonly TargetAsset[];
  readonly onClose: () => void;
  readonly onAddHolding: (holding: HoldingSelection) => void;
  readonly onUpdateHolding: (holding: HoldingUpdate) => void;
}) {
  const initialDraft =
    state.kind === "add"
      ? emptyDraft(state.accountId)
      : {
          accountId: state.row.accountId,
          symbol: state.row.symbol,
          currentPrice: state.row.currentPrice,
          quantity: state.row.quantity,
          averagePrice: state.row.averagePrice,
        };
  const targetCandidates = targets.filter((target) => target.accountId === initialDraft.accountId);
  const initialTarget = targetCandidates.find((target) => target.symbol === initialDraft.symbol) ?? null;
  const [draft, setDraft] = useState<HoldingDraft>(initialDraft);
  const [symbolQuery, setSymbolQuery] = useState(initialDraft.symbol);
  const [nameQuery, setNameQuery] = useState(initialTarget?.productName ?? (state.kind === "edit" ? state.row.productName : ""));
  const [activePicker, setActivePicker] = useState<TargetSearchMode | null>(null);
  const selectedTarget = targetCandidates.find((target) => target.symbol === draft.symbol) ?? null;
  const selectedInstrument = instruments.find((instrument) => instrument.symbol === draft.symbol) ?? null;
  const editingKey = state.kind === "edit" ? { accountId: state.row.accountId, symbol: state.row.symbol } : null;
  const duplicateKey = hasHolding(holdings, { accountId: draft.accountId, symbol: draft.symbol }, editingKey);
  const accountName = accounts.find((account) => account.id === draft.accountId)?.name ?? draft.accountId;
  const canSubmit =
    selectedTarget !== null &&
    selectedInstrument !== null &&
    Number.isFinite(draft.currentPrice) &&
    Number.isFinite(draft.quantity) &&
    Number.isFinite(draft.averagePrice) &&
    draft.currentPrice >= 0 &&
    draft.quantity >= 0 &&
    draft.averagePrice >= 0 &&
    !duplicateKey;

  const selectTarget = (target: TargetAsset) => {
    setDraft({ ...draft, symbol: target.symbol });
    setSymbolQuery(target.symbol);
    setNameQuery(target.productName);
    setActivePicker(null);
  };
  const updateSymbolQuery = (value: string) => {
    const nextSymbol = value.trim().toUpperCase();
    const target = targetCandidates.find((item) => item.symbol === nextSymbol);
    setSymbolQuery(value.toUpperCase());
    setNameQuery(target?.productName ?? "");
    setDraft({ ...draft, symbol: target?.symbol ?? nextSymbol });
  };
  const updateNameQuery = (value: string) => {
    const target = targetCandidates.find((item) => item.productName === value);
    setNameQuery(value);
    setSymbolQuery(target?.symbol ?? "");
    setDraft({ ...draft, symbol: target?.symbol ?? "" });
  };
  const submit = () => {
    if (!canSubmit || selectedTarget === null || selectedInstrument === null) {
      return;
    }
    if (state.kind === "add") {
      onAddHolding({ draft, target: selectedTarget, instrument: selectedInstrument });
    } else {
      onUpdateHolding({
        key: { accountId: state.row.accountId, symbol: state.row.symbol },
        draft,
        target: selectedTarget,
        instrument: selectedInstrument,
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="panel target-dialog" role="dialog" aria-modal="true" aria-labelledby="holding-dialog-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">현재 보유</p>
            <h2 id="holding-dialog-title">{state.kind === "add" ? "보유 항목 추가" : "보유 항목 수정"}</h2>
          </div>
          <button className="icon-command" type="button" onClick={onClose} aria-label="보유 항목 팝업 닫기">
            <X size={16} aria-hidden="true" />
            닫기
          </button>
        </div>
        <div className="target-editor" aria-label="현재 보유 입력">
          <label>
            계좌
            <input type="text" value={accountName} readOnly />
          </label>
          <TargetAssetSearchField
            label="종목코드"
            mode="symbol"
            value={symbolQuery}
            targets={targetCandidates}
            isOpen={activePicker === "symbol"}
            onValueChange={updateSymbolQuery}
            onTargetSelect={selectTarget}
            onOpen={() => setActivePicker("symbol")}
            onClose={() => setActivePicker(null)}
          />
          <TargetAssetSearchField
            label="종목명"
            mode="name"
            value={nameQuery}
            targets={targetCandidates}
            isOpen={activePicker === "name"}
            onValueChange={updateNameQuery}
            onTargetSelect={selectTarget}
            onOpen={() => setActivePicker("name")}
            onClose={() => setActivePicker(null)}
          />
          <label>
            통화
            <input type="text" value={selectedInstrument?.currency ?? ""} readOnly />
          </label>
          <label>
            현재가
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.currentPrice}
              onChange={(event) => setDraft({ ...draft, currentPrice: Number(event.currentTarget.value) })}
            />
          </label>
          <label>
            보유 수량
            <input
              type="number"
              min="0"
              step="1"
              value={draft.quantity}
              onChange={(event) => setDraft({ ...draft, quantity: Number(event.currentTarget.value) })}
            />
          </label>
          <label>
            평균 매입가
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.averagePrice}
              onChange={(event) => setDraft({ ...draft, averagePrice: Number(event.currentTarget.value) })}
            />
          </label>
          <div className="target-actions">
            <button className="command command-primary" type="button" disabled={!canSubmit} onClick={submit}>
              {state.kind === "add" ? <Plus size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
              {state.kind === "add" ? "추가" : "저장"}
            </button>
          </div>
        </div>
        {selectedTarget === null && (symbolQuery.trim().length > 0 || nameQuery.trim().length > 0) ? (
          <p className="form-feedback target-feedback">현재 계좌의 목표 비중 항목 중에서 선택할 수 있습니다.</p>
        ) : null}
        {duplicateKey ? <p className="form-feedback target-feedback">이 계좌에 이미 보유 항목으로 등록된 종목입니다.</p> : null}
      </section>
    </div>
  );
}
