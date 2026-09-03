import { Boxes, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { hasInstrumentSymbol } from "../instrumentState";
import { instrumentCategories, type Instrument, type InstrumentDraft, type SymbolCode } from "../types";

const emptyDraft: InstrumentDraft = {
  name: "",
  symbol: "",
  currency: "KRW",
  category: "국내 ETF",
};

export function InstrumentManager({
  instruments,
  onAddInstrument,
  onUpdateInstrument,
  onDeleteInstrument,
}: {
  readonly instruments: readonly Instrument[];
  readonly onAddInstrument: (draft: InstrumentDraft) => void;
  readonly onUpdateInstrument: (symbol: SymbolCode, draft: InstrumentDraft) => void;
  readonly onDeleteInstrument: (symbol: SymbolCode) => void;
}) {
  const [draft, setDraft] = useState<InstrumentDraft>(emptyDraft);
  const [editingSymbol, setEditingSymbol] = useState<SymbolCode | null>(null);
  const isEditing = editingSymbol !== null;
  const isDuplicate = hasInstrumentSymbol(instruments, draft.symbol, editingSymbol);
  const canSubmit = draft.name.trim().length > 0 && draft.symbol.trim().length > 0 && !isDuplicate;

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingSymbol(null);
  };

  const submit = () => {
    if (!canSubmit) {
      return;
    }
    if (editingSymbol === null) {
      onAddInstrument(draft);
    } else {
      onUpdateInstrument(editingSymbol, draft);
    }
    resetForm();
  };

  return (
    <section className="panel instrument-manager">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">종목 관리</p>
          <h2>종목 추가/수정/삭제</h2>
        </div>
        <Boxes size={22} aria-hidden="true" />
      </div>
      <div className="metadata-manager-body">
        <div className="metadata-form" aria-label="종목 입력">
          <label>
            종목명
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })}
            />
          </label>
          <label>
            종목코드
            <input
              type="text"
              value={draft.symbol}
              onChange={(event) => setDraft({ ...draft, symbol: event.currentTarget.value })}
            />
          </label>
          <label>
            거래통화
            <select
              value={draft.currency}
              onChange={(event) => setDraft({ ...draft, currency: event.currentTarget.value === "USD" ? "USD" : "KRW" })}
            >
              <option value="KRW">KRW</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label>
            종류
            <select
              value={draft.category}
              onChange={(event) => {
                const nextCategory = instrumentCategories.find((category) => category === event.currentTarget.value);
                setDraft({ ...draft, category: nextCategory ?? "국내 ETF" });
              }}
            >
              {instrumentCategories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <button className="command command-primary" type="button" disabled={!canSubmit} onClick={submit}>
            {isEditing ? <Pencil size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {isEditing ? "저장" : "추가"}
          </button>
          <button className="command command-ghost" type="button" disabled={!isEditing} onClick={resetForm}>
            <X size={16} aria-hidden="true" />
            취소
          </button>
        </div>
        {isDuplicate ? <p className="form-feedback">이미 등록된 종목코드입니다.</p> : null}
        <div className="metadata-list" aria-label="등록된 종목">
          {instruments.map((instrument) => (
            <article className={editingSymbol === instrument.symbol ? "metadata-row selected" : "metadata-row"} key={instrument.symbol}>
              <div>
                <strong>{instrument.name}</strong>
                <span>{instrument.symbol}</span>
              </div>
              <div className="instrument-tags" aria-label="종목 속성">
                <span>{instrument.currency}</span>
                <span>{instrument.category}</span>
              </div>
              <div className="row-actions">
                <button
                  className="icon-command"
                  type="button"
                  onClick={() => {
                    setDraft({
                      name: instrument.name,
                      symbol: instrument.symbol,
                      currency: instrument.currency,
                      category: instrument.category,
                    });
                    setEditingSymbol(instrument.symbol);
                  }}
                >
                  <Pencil size={16} aria-hidden="true" />
                  수정
                </button>
                <button
                  className="icon-command danger"
                  type="button"
                  onClick={() => {
                    onDeleteInstrument(instrument.symbol);
                    if (editingSymbol === instrument.symbol) {
                      resetForm();
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
