import { Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { nextSortDirection, sortByNumber, type SortDirection } from "../portfolioSort";
import { TargetAllocationDialog, type TargetAllocationDialogState } from "./TargetAllocationDialog";
import { TargetAllocationRows } from "./TargetAllocationRows";
import { SortHeaderButton } from "./SortHeaderButton";
import {
  type Account,
  type AccountId,
  type Instrument,
  type MarketDetailSubject,
  type TargetAllocationDraft,
  type TargetAllocationKey,
  type TargetAsset,
} from "../types";

const emptyDraft = (accountId: AccountId): TargetAllocationDraft => ({
  accountId,
  symbol: "",
  suitability: "일반",
  targetPercent: 0,
});

export function StrategyTable({
  accounts,
  activeAccount,
  instruments,
  targets,
  onAddTargetAllocation,
  onUpdateTargetAllocation,
  onDeleteTargetAllocation,
  onOpenMarketDetail,
}: {
  readonly accounts: readonly Account[];
  readonly activeAccount: AccountId | "all";
  readonly instruments: readonly Instrument[];
  readonly targets: readonly TargetAsset[];
  readonly onAddTargetAllocation: (draft: TargetAllocationDraft, instrument: Instrument) => void;
  readonly onUpdateTargetAllocation: (
    key: TargetAllocationKey,
    draft: TargetAllocationDraft,
    instrument: Instrument,
  ) => void;
  readonly onDeleteTargetAllocation: (key: TargetAllocationKey) => void;
  readonly onOpenMarketDetail: (subject: MarketDetailSubject) => void;
}) {
  const [weightSort, setWeightSort] = useState<SortDirection>("desc");
  const rows = sortByNumber(
    targets.filter((target) => activeAccount === "all" || target.accountId === activeAccount),
    (target) => target.targetPercent,
    weightSort,
  );
  const defaultAccountId = accounts[0]?.id ?? "";
  const [dialogState, setDialogState] = useState<TargetAllocationDialogState | null>(null);
  const addAccountId = activeAccount === "all" ? defaultAccountId : activeAccount;
  const canAddInCurrentView = activeAccount !== "all" && defaultAccountId.length > 0;

  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">투자 전략 설정</p>
          <h2>목표 비중</h2>
        </div>
        <div className="panel-heading-actions">
          <button
            className="command command-primary"
            type="button"
            disabled={!canAddInCurrentView}
            onClick={() => setDialogState({ kind: "add", accountId: addAccountId })}
          >
            <Plus size={16} aria-hidden="true" />
            새 항목 추가
          </button>
          <SlidersHorizontal size={22} aria-hidden="true" />
        </div>
      </div>
      {!canAddInCurrentView ? <p className="target-hint">계좌별 화면에서 새 목표 비중 항목을 추가할 수 있습니다.</p> : null}
      <div className="table-scroll">
        <table>
          <caption>계좌별 목표 투자 비중</caption>
          <thead>
            <tr>
              <th scope="col">계좌</th>
              <th scope="col">자산군</th>
              <th scope="col">종목 코드</th>
              <th scope="col">종목명</th>
              <th scope="col">적합성</th>
              <th scope="col">
                <SortHeaderButton
                  label="목표 비율"
                  direction={weightSort}
                  onToggle={() => setWeightSort((current) => nextSortDirection(current))}
                />
              </th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            <TargetAllocationRows
              rows={rows}
              accounts={accounts}
              instruments={instruments}
              onEditTarget={(target) => setDialogState({ kind: "edit", target })}
              onDeleteTargetAllocation={onDeleteTargetAllocation}
              onOpenMarketDetail={onOpenMarketDetail}
            />
          </tbody>
        </table>
      </div>
      {dialogState !== null ? (
        <TargetAllocationDialog
          state={dialogState}
          accounts={accounts}
          instruments={instruments}
          targets={targets}
          onClose={() => setDialogState(null)}
          onAddTargetAllocation={onAddTargetAllocation}
          onUpdateTargetAllocation={onUpdateTargetAllocation}
        />
      ) : null}
    </section>
  );
}
