import { ArrowDownUp, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import type { SortDirection } from "../portfolioSort";

export function SortHeaderButton({
  label,
  direction,
  isActive = true,
  onToggle,
}: {
  readonly label: string;
  readonly direction: SortDirection;
  readonly isActive?: boolean;
  readonly onToggle: () => void;
}) {
  const Icon = !isActive ? ArrowDownUp : direction === "desc" ? ArrowDownWideNarrow : ArrowUpNarrowWide;
  const directionText = direction === "desc" ? "내림차순" : "오름차순";

  return (
    <button
      aria-label={`${label} ${isActive ? directionText : "내림차순"} 정렬`}
      className={isActive ? "sort-header-button active" : "sort-header-button"}
      onClick={onToggle}
      type="button"
    >
      <span>{label}</span>
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}
