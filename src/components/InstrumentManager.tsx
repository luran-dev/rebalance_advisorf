import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { hasInstrumentSymbol } from "../instrumentState";
import type { Instrument, InstrumentDraft, SymbolCode } from "../types";
import { InstrumentDialog, type InstrumentDialogState } from "./InstrumentDialog";

export function InstrumentManager({
  instruments,
  onAddInstrument,
  onUpdateInstrument,
  onDeleteInstrument,
}: {
  readonly instruments: readonly Instrument[];
  readonly onAddInstrument: (draft: InstrumentDraft) => Promise<void>;
  readonly onUpdateInstrument: (symbol: SymbolCode, draft: InstrumentDraft) => Promise<void>;
  readonly onDeleteInstrument: (symbol: SymbolCode) => void;
}) {
  const [dialogState, setDialogState] = useState<InstrumentDialogState | null>(null);
  const ignoredSymbol = dialogState?.kind === "edit" ? dialogState.instrument.symbol : null;

  return (
    <section className="panel instrument-manager">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">종목 관리</p>
          <h2>종목 추가/수정/삭제</h2>
        </div>
        <div className="panel-heading-actions">
          <button className="command command-primary" type="button" onClick={() => setDialogState({ kind: "add" })}>
            <Plus size={16} aria-hidden="true" />
            새 종목 추가
          </button>
          <Boxes size={22} aria-hidden="true" />
        </div>
      </div>
      <div className="metadata-manager-body">
        <div className="metadata-list" aria-label="등록된 종목">
          {instruments.map((instrument) => (
            <article className="metadata-row" key={instrument.symbol}>
              <div>
                <strong>{instrument.name}</strong>
                <span>{instrument.symbol}</span>
              </div>
              <div className="instrument-tags" aria-label="종목 속성">
                <span>{instrument.country}</span>
                <span>{instrument.currency}</span>
                <span>{instrument.category}</span>
                <span className={`risk-badge risk-badge-${instrument.riskTone ?? "neutral"}`}>
                  위험도 {instrument.riskLabel ?? "미계산"}
                </span>
              </div>
              <div className="row-actions">
                <button
                  className="icon-command icon-only"
                  type="button"
                  onClick={() => setDialogState({ kind: "edit", instrument })}
                  aria-label={`${instrument.name} 종목 수정`}
                  title="수정"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  className="icon-command icon-only danger"
                  type="button"
                  onClick={() => onDeleteInstrument(instrument.symbol)}
                  aria-label={`${instrument.name} 종목 삭제`}
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
        <InstrumentDialog
          state={dialogState}
          isDuplicate={(symbol) => hasInstrumentSymbol(instruments, symbol, ignoredSymbol)}
          onClose={() => setDialogState(null)}
          onAddInstrument={onAddInstrument}
          onUpdateInstrument={onUpdateInstrument}
        />
      ) : null}
    </section>
  );
}
