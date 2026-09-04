import { Pencil, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { hasTargetAllocation, sumTargetPercent } from "../targetAllocationState";
import {
  suitabilityOptions,
  type Account,
  type AccountId,
  type Instrument,
  type TargetAllocationDraft,
  type TargetAllocationKey,
  type TargetAsset,
} from "../types";
import { InstrumentSearchField } from "./InstrumentSearchField";

export type TargetAllocationDialogState =
  | { readonly kind: "add"; readonly accountId: AccountId }
  | { readonly kind: "edit"; readonly target: TargetAsset };

const emptyDraft = (accountId: AccountId): TargetAllocationDraft => ({
  accountId,
  symbol: "",
  suitability: "일반",
  targetPercent: 0,
});

export function TargetAllocationDialog({
  state,
  accounts,
  instruments,
  targets,
  onClose,
  onAddTargetAllocation,
  onUpdateTargetAllocation,
}: {
  readonly state: TargetAllocationDialogState;
  readonly accounts: readonly Account[];
  readonly instruments: readonly Instrument[];
  readonly targets: readonly TargetAsset[];
  readonly onClose: () => void;
  readonly onAddTargetAllocation: (draft: TargetAllocationDraft, instrument: Instrument) => void;
  readonly onUpdateTargetAllocation: (
    key: TargetAllocationKey,
    draft: TargetAllocationDraft,
    instrument: Instrument,
  ) => void;
}) {
  const initialDraft = useMemo(
    () =>
      state.kind === "add"
        ? emptyDraft(state.accountId)
        : {
            accountId: state.target.accountId,
            symbol: state.target.symbol,
            suitability: state.target.suitability,
            targetPercent: state.target.targetPercent,
          },
    [state],
  );
  const initialInstrument = useMemo(
    () => instruments.find((instrument) => instrument.symbol === initialDraft.symbol) ?? null,
    [initialDraft.symbol, instruments],
  );
  const [draft, setDraft] = useState<TargetAllocationDraft>(initialDraft);
  const [symbolQuery, setSymbolQuery] = useState(initialDraft.symbol);
  const [nameQuery, setNameQuery] = useState(initialInstrument?.name ?? (state.kind === "edit" ? state.target.productName : ""));
  const [activePicker, setActivePicker] = useState<"symbol" | "name" | null>(null);
  const selectedInstrument = instruments.find((instrument) => instrument.symbol === draft.symbol) ?? null;
  const editingKey = state.kind === "edit" ? { accountId: state.target.accountId, symbol: state.target.symbol } : null;
  const accountName = accounts.find((account) => account.id === draft.accountId)?.name ?? draft.accountId;
  const scopedPercentSum = sumTargetPercent(targets, draft.accountId);
  const previewPercentSum = useMemo(() => {
    const originalPercent =
      editingKey === null
        ? 0
        : targets.find((target) => target.accountId === editingKey.accountId && target.symbol === editingKey.symbol)
            ?.targetPercent ?? 0;
    return scopedPercentSum - originalPercent + draft.targetPercent;
  }, [draft.targetPercent, editingKey, scopedPercentSum, targets]);
  const duplicateKey = hasTargetAllocation(targets, { accountId: draft.accountId, symbol: draft.symbol }, editingKey);
  const hasUnresolvedInstrumentSearch =
    selectedInstrument === null && (symbolQuery.trim().length > 0 || nameQuery.trim().length > 0);
  const canSubmit =
    selectedInstrument !== null && Number.isFinite(draft.targetPercent) && draft.targetPercent >= 0 && !duplicateKey;

  useEffect(() => {
    setDraft(initialDraft);
    setSymbolQuery(initialDraft.symbol);
    setNameQuery(initialInstrument?.name ?? (state.kind === "edit" ? state.target.productName : ""));
    setActivePicker(null);
  }, [initialDraft, initialInstrument, state]);

  const selectInstrument = (instrument: Instrument) => {
    setDraft({ ...draft, symbol: instrument.symbol });
    setSymbolQuery(instrument.symbol);
    setNameQuery(instrument.name);
    setActivePicker(null);
  };

  const updateSymbolQuery = (value: string) => {
    const nextSymbol = value.trim().toUpperCase();
    const instrument = instruments.find((item) => item.symbol === nextSymbol);
    setSymbolQuery(value.toUpperCase());
    setNameQuery(instrument?.name ?? "");
    setDraft({ ...draft, symbol: instrument?.symbol ?? nextSymbol });
  };

  const updateNameQuery = (value: string) => {
    const instrument = instruments.find((item) => item.name === value);
    setNameQuery(value);
    setSymbolQuery(instrument?.symbol ?? "");
    setDraft({ ...draft, symbol: instrument?.symbol ?? "" });
  };

  const submit = () => {
    if (!canSubmit || selectedInstrument === null) {
      return;
    }
    if (state.kind === "add") {
      onAddTargetAllocation(draft, selectedInstrument);
    } else {
      onUpdateTargetAllocation(
        { accountId: state.target.accountId, symbol: state.target.symbol },
        draft,
        selectedInstrument,
      );
    }
    onClose();
  };

  const dialog = (
    <div className="modal-backdrop" role="presentation">
      <section
        className="panel target-dialog target-allocation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="target-dialog-title"
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">투자 전략 설정</p>
            <h2 id="target-dialog-title">{state.kind === "add" ? "목표 비중 추가" : "목표 비중 수정"}</h2>
          </div>
          <button className="icon-command" type="button" onClick={onClose} aria-label="목표 비중 팝업 닫기">
            <X size={16} aria-hidden="true" />
            닫기
          </button>
        </div>
        <div className="target-editor" aria-label="목표 비중 입력">
          <label>
            계좌
            <input type="text" value={accountName} readOnly />
          </label>
          <InstrumentSearchField
            label="종목코드"
            mode="symbol"
            value={symbolQuery}
            instruments={instruments}
            isOpen={activePicker === "symbol"}
            onValueChange={updateSymbolQuery}
            onInstrumentSelect={selectInstrument}
            onOpen={() => setActivePicker("symbol")}
            onClose={() => setActivePicker(null)}
          />
          <InstrumentSearchField
            label="종목명"
            mode="name"
            value={nameQuery}
            instruments={instruments}
            isOpen={activePicker === "name"}
            onValueChange={updateNameQuery}
            onInstrumentSelect={selectInstrument}
            onOpen={() => setActivePicker("name")}
            onClose={() => setActivePicker(null)}
          />
          <label>
            자산군
            <input type="text" value={selectedInstrument?.category ?? ""} readOnly />
          </label>
          <label>
            적합성
            <select
              value={draft.suitability}
              onChange={(event) => {
                const nextSuitability = suitabilityOptions.find((option) => option === event.currentTarget.value);
                setDraft({ ...draft, suitability: nextSuitability ?? "일반" });
              }}
            >
              {suitabilityOptions.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            목표비율
            <span className="percent-input">
              <input
                type="number"
                value={draft.targetPercent}
                min="0"
                max="100"
                step="0.5"
                onChange={(event) => setDraft({ ...draft, targetPercent: Number(event.currentTarget.value) })}
              />
              <span>%</span>
            </span>
          </label>
          <div className="target-actions">
            <div className="target-total" aria-live="polite">
              <span>입력 합계</span>
              <strong>{previewPercentSum.toFixed(1)}%</strong>
            </div>
            <button className="command command-primary" type="button" disabled={!canSubmit} onClick={submit}>
              {state.kind === "add" ? <Plus size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
              {state.kind === "add" ? "추가" : "저장"}
            </button>
          </div>
        </div>
        {hasUnresolvedInstrumentSearch ? (
          <p className="form-feedback target-feedback">종목 관리에 등록된 종목코드만 선택할 수 있습니다.</p>
        ) : null}
        {duplicateKey ? <p className="form-feedback target-feedback">이 계좌에 이미 등록된 종목코드입니다.</p> : null}
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
}
