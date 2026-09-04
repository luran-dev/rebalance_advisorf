import { ChevronDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { TargetAsset } from "../types";

export type TargetSearchMode = "name" | "symbol";

const targetMatches = (target: TargetAsset, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase();

  return (
    normalizedQuery.length === 0 ||
    target.symbol.toLowerCase().includes(normalizedQuery) ||
    target.productName.toLowerCase().includes(normalizedQuery)
  );
};

export function TargetAssetSearchField({
  label,
  mode,
  value,
  targets,
  isOpen,
  onValueChange,
  onTargetSelect,
  onOpen,
  onClose,
}: {
  readonly label: string;
  readonly mode: TargetSearchMode;
  readonly value: string;
  readonly targets: readonly TargetAsset[];
  readonly isOpen: boolean;
  readonly onValueChange: (value: string) => void;
  readonly onTargetSelect: (target: TargetAsset) => void;
  readonly onOpen: () => void;
  readonly onClose: () => void;
}) {
  const inputId = useId();
  const [showAll, setShowAll] = useState(false);
  const visibleTargets = useMemo(
    () => (showAll ? targets : targets.filter((target) => targetMatches(target, value))),
    [showAll, targets, value],
  );
  const close = () => {
    setShowAll(false);
    onClose();
  };
  const toggleAll = () => {
    if (isOpen) {
      close();
      return;
    }
    setShowAll(true);
    onOpen();
  };
  const selectTarget = (target: TargetAsset) => {
    onTargetSelect(target);
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
          {visibleTargets.map((target) => (
            <button
              className="instrument-option"
              key={`${target.accountId}-${target.symbol}`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectTarget(target);
              }}
            >
              <strong>{mode === "symbol" ? target.symbol : target.productName}</strong>
              <span>{mode === "symbol" ? target.productName : target.symbol}</span>
            </button>
          ))}
          {visibleTargets.length === 0 ? <span className="instrument-option empty">목표 비중 항목 없음</span> : null}
        </span>
      ) : null}
    </div>
  );
}
