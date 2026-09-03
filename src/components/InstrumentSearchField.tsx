import { ChevronDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Instrument } from "../types";

type InstrumentSearchMode = "name" | "symbol";

const instrumentMatches = (instrument: Instrument, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase();

  return (
    normalizedQuery.length === 0 ||
    instrument.symbol.toLowerCase().includes(normalizedQuery) ||
    instrument.name.toLowerCase().includes(normalizedQuery)
  );
};

export function InstrumentSearchField({
  label,
  mode,
  value,
  instruments,
  isOpen,
  onValueChange,
  onInstrumentSelect,
  onOpen,
  onClose,
}: {
  readonly label: string;
  readonly mode: InstrumentSearchMode;
  readonly value: string;
  readonly instruments: readonly Instrument[];
  readonly isOpen: boolean;
  readonly onValueChange: (value: string) => void;
  readonly onInstrumentSelect: (instrument: Instrument) => void;
  readonly onOpen: () => void;
  readonly onClose: () => void;
}) {
  const inputId = useId();
  const [showAll, setShowAll] = useState(false);
  const visibleInstruments = useMemo(
    () => (showAll ? instruments : instruments.filter((instrument) => instrumentMatches(instrument, value))),
    [instruments, showAll, value],
  );

  const openAll = () => {
    setShowAll(true);
    onOpen();
  };

  const close = () => {
    setShowAll(false);
    onClose();
  };

  const toggleAll = () => {
    if (isOpen) {
      close();
      return;
    }
    openAll();
  };

  const selectInstrument = (instrument: Instrument) => {
    onInstrumentSelect(instrument);
    close();
  };

  return (
    <div className="instrument-search">
      <label htmlFor={inputId}>{label}</label>
      <span className="instrument-input-control">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => {
            const nextValue = mode === "symbol" ? event.currentTarget.value.toUpperCase() : event.currentTarget.value;
            onValueChange(nextValue);
            setShowAll(false);
            onOpen();
          }}
          onFocus={onOpen}
          onBlur={() => window.setTimeout(close, 120)}
        />
        <button
          aria-label={`${label} 목록 열기`}
          className="instrument-picker-button"
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleAll}
        >
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </span>
      {isOpen ? (
        <span className="instrument-options" role="listbox">
          {visibleInstruments.map((instrument) => (
            <button
              className="instrument-option"
              key={instrument.symbol}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectInstrument(instrument);
              }}
            >
              <strong>{mode === "symbol" ? instrument.symbol : instrument.name}</strong>
              <span>{mode === "symbol" ? instrument.name : instrument.symbol}</span>
            </button>
          ))}
          {visibleInstruments.length === 0 ? <span className="instrument-option empty">검색 결과 없음</span> : null}
        </span>
      ) : null}
    </div>
  );
}
