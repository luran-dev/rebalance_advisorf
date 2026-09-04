import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  countryOptions,
  instrumentCategories,
  type Country,
  type Currency,
  type Instrument,
  type InstrumentCategory,
  type InstrumentDraft,
} from "../types";

export type InstrumentDialogState =
  | { readonly kind: "add" }
  | { readonly kind: "edit"; readonly instrument: Instrument };

const emptyDraft: InstrumentDraft = {
  name: "",
  symbol: "",
  country: "한국",
  currency: "KRW",
  category: "국내 ETF",
};

const currencyFromValue = (value: string): Currency => (value === "USD" ? "USD" : "KRW");
const countryFromValue = (value: string): Country => countryOptions.find((country) => country === value) ?? "한국";
const categoryFromValue = (value: string): InstrumentCategory =>
  instrumentCategories.find((category) => category === value) ?? "국내 ETF";

export function InstrumentDialog({
  state,
  isDuplicate,
  onClose,
  onAddInstrument,
  onUpdateInstrument,
}: {
  readonly state: InstrumentDialogState;
  readonly isDuplicate: (symbol: string) => boolean;
  readonly onClose: () => void;
  readonly onAddInstrument: (draft: InstrumentDraft) => void;
  readonly onUpdateInstrument: (symbol: string, draft: InstrumentDraft) => void;
}) {
  const [draft, setDraft] = useState<InstrumentDraft>(
    state.kind === "add"
      ? emptyDraft
      : {
          name: state.instrument.name,
          symbol: state.instrument.symbol,
          country: state.instrument.country,
          currency: state.instrument.currency,
          category: state.instrument.category,
        },
  );
  const duplicate = isDuplicate(draft.symbol);
  const canSubmit = draft.name.trim().length > 0 && draft.symbol.trim().length > 0 && !duplicate;
  const submit = () => {
    if (!canSubmit) {
      return;
    }
    if (state.kind === "add") {
      onAddInstrument(draft);
    } else {
      onUpdateInstrument(state.instrument.symbol, draft);
    }
    onClose();
  };

  const dialog = (
    <div className="modal-backdrop" role="presentation">
      <section className="panel target-dialog" role="dialog" aria-modal="true" aria-labelledby="instrument-dialog-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">종목 관리</p>
            <h2 id="instrument-dialog-title">{state.kind === "add" ? "종목 추가" : "종목 수정"}</h2>
          </div>
          <button className="icon-command" type="button" onClick={onClose} aria-label="종목 팝업 닫기">
            <X size={16} aria-hidden="true" />
            닫기
          </button>
        </div>
        <div className="target-editor" aria-label="종목 입력">
          <label>
            종목명
            <input type="text" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })} />
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
            <select value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: currencyFromValue(event.currentTarget.value) })}>
              <option value="KRW">KRW</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label>
            국가
            <select value={draft.country} onChange={(event) => setDraft({ ...draft, country: countryFromValue(event.currentTarget.value) })}>
              {countryOptions.map((country) => (
                <option value={country} key={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label>
            종류
            <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: categoryFromValue(event.currentTarget.value) })}>
              {instrumentCategories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <div className="target-actions">
            <button className="command command-primary" type="button" disabled={!canSubmit} onClick={submit}>
              {state.kind === "add" ? <Plus size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
              {state.kind === "add" ? "추가" : "저장"}
            </button>
          </div>
        </div>
        {duplicate ? <p className="form-feedback target-feedback">이미 등록된 종목코드입니다.</p> : null}
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
}
