import { Plus, RefreshCw, TableProperties } from "lucide-react";
import { useRef, useState } from "react";
import { useFrozenColumns } from "../useFrozenColumns";
import type { HoldingSelection, HoldingUpdate } from "../holdingState";
import { nextSortState, sortByNumber, sortByText, type SortState } from "../portfolioSort";
import type {
  Account,
  AccountId,
  CashPosition,
  ExchangeRates,
  HoldingKey,
  HoldingRow,
  Instrument,
  MarketDetailSubject,
  TargetAsset,
} from "../types";
import { CashPositionEditor } from "./CashPositionEditor";
import { HoldingDialog, type HoldingDialogState } from "./HoldingDialog";
import { HoldingTableRow } from "./HoldingTableRow";
import { SortHeaderButton } from "./SortHeaderButton";

type HoldingSortKey =
  | "productName"
  | "currentPercent"
  | "targetPercent"
  | "investedValue"
  | "marketValue"
  | "returnPercent"
  | "profit";
const ariaSort = (sortState: SortState<HoldingSortKey>, key: HoldingSortKey): "ascending" | "descending" | "none" => {
  if (sortState.key !== key) {
    return "none";
  }
  return sortState.direction === "asc" ? "ascending" : "descending";
};

export function HoldingsTable({
  accounts,
  activeAccount,
  rows,
  cashPositions,
  exchangeRates,
  instruments,
  targets,
  isRefreshingPrices,
  priceRefreshStatus,
  isRefreshingFx,
  fxRefreshStatus,
  onRefreshPrices,
  onRefreshFx,
  onAddHolding,
  onUpdateHolding,
  onDeleteHolding,
  onUpdateCashPosition,
  onOpenMarketDetail,
}: {
  readonly accounts: readonly Account[];
  readonly activeAccount: AccountId | "all";
  readonly rows: readonly HoldingRow[];
  readonly cashPositions: readonly CashPosition[];
  readonly exchangeRates: ExchangeRates;
  readonly instruments: readonly Instrument[];
  readonly targets: readonly TargetAsset[];
  readonly isRefreshingPrices: boolean;
  readonly priceRefreshStatus: string;
  readonly isRefreshingFx: boolean;
  readonly fxRefreshStatus: string;
  readonly onRefreshPrices: () => void;
  readonly onRefreshFx: () => void;
  readonly onAddHolding: (holding: HoldingSelection) => void;
  readonly onUpdateHolding: (holding: HoldingUpdate) => void;
  readonly onDeleteHolding: (key: HoldingKey) => void;
  readonly onUpdateCashPosition: (update: CashPosition) => void;
  readonly onOpenMarketDetail: (subject: MarketDetailSubject) => void;
}) {
  const tableScroll = useRef<HTMLDivElement>(null);
  const [frozenCount, setFrozenCount] = useState(0);
  const frozenOffsets = useFrozenColumns(tableScroll, frozenCount);
  const scrollColumns = (direction: number) => {
    const container = tableScroll.current;
    if (container !== null) {
      const frozenWidth = Number.parseFloat(container.style.getPropertyValue("--frozen-width")) || 0;
      const managementWidth = container.querySelector("thead th:last-child")?.getBoundingClientRect().width ?? 0;
      container.scrollBy({ left: direction * Math.max(100, container.clientWidth - frozenWidth - managementWidth) * 0.75 });
    }
  };
  const [dialogState, setDialogState] = useState<HoldingDialogState | null>(null);
  const [sortState, setSortState] = useState<SortState<HoldingSortKey>>({
    key: "currentPercent",
    direction: "desc",
  });
  const canAddInCurrentView = activeAccount !== "all";
  const sortedRows = (() => {
    switch (sortState.key) {
      case "productName":
        return sortByText(rows, (row) => row.productName, sortState.direction);
      case "currentPercent":
        return sortByNumber(rows, (row) => row.currentPercent, sortState.direction);
      case "targetPercent":
        return sortByNumber(rows, (row) => row.targetPercent, sortState.direction);
      case "investedValue":
        return sortByNumber(rows, (row) => row.investedValue, sortState.direction);
      case "marketValue":
        return sortByNumber(rows, (row) => row.marketValue, sortState.direction);
      case "returnPercent":
        return sortByNumber(rows, (row) => row.returnPercent, sortState.direction);
      case "profit":
        return sortByNumber(rows, (row) => row.profit, sortState.direction);
    }
  })();
  const toggleSort = (key: HoldingSortKey) => setSortState((current) => nextSortState(current, key));

  return (
    <section className="panel table-panel holdings-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">주식 리스트</p>
          <h2>현재 보유와 매매 가이드</h2>
        </div>
        <div className="panel-heading-actions">
          <button
            className="command"
            type="button"
            disabled={rows.length === 0 || isRefreshingPrices}
            onClick={onRefreshPrices}
          >
            <RefreshCw size={16} aria-hidden="true" />
            현재가 갱신
          </button>
          <button className="command" type="button" disabled={isRefreshingFx} onClick={onRefreshFx}>
            <RefreshCw size={16} aria-hidden="true" />
            환율 갱신
          </button>
          <button
            className="command command-primary"
            type="button"
            disabled={!canAddInCurrentView}
            onClick={() => {
              if (activeAccount !== "all") {
                setDialogState({ kind: "add", accountId: activeAccount });
              }
            }}
          >
            <Plus size={16} aria-hidden="true" />
            새 항목 추가
          </button>
          <TableProperties size={22} aria-hidden="true" />
        </div>
      </div>
      <p className="target-hint">시세 상태: {priceRefreshStatus}</p>
      <p className="target-hint">환율 상태: {fxRefreshStatus}</p>
      {!canAddInCurrentView ? <p className="target-hint">계좌별 화면에서 새 보유 항목을 추가할 수 있습니다.</p> : null}
      <CashPositionEditor
        accounts={accounts}
        activeAccount={activeAccount}
        cashPositions={cashPositions}
        exchangeRates={exchangeRates}
        onUpdateCashPosition={onUpdateCashPosition}
      />
      <div className="holdings-scroll-controls">
        <span>좌우로 이동하면 모든 열을 볼 수 있습니다. 관리 버튼은 오른쪽에 고정됩니다.</span>
        <label className="frozen-column-control">
          열 고정
          <select aria-label="보유 목록 고정할 마지막 열" value={frozenCount} onChange={(event) => setFrozenCount(Number(event.currentTarget.value))}>
            <option value={0}>고정 안 함</option>
            {["계좌", "종목명", "코드", "통화", "현재가", "보유 수량", "평균 매입가", "매입 금액", "평가 금액", "손익", "수익률", "현재 비율", "목표 비율", "매매 가이드", "분석 소견"].map((label, index) => (
              <option key={label} value={index + 1}>{label}까지 고정</option>
            ))}
          </select>
        </label>
        <span role="status">{frozenCount > frozenOffsets.length ? `화면 폭에 맞춰 앞 ${frozenOffsets.length}개 열을 고정했습니다.` : frozenCount > 0 ? `앞 ${frozenOffsets.length}개 열 고정` : ""}</span>
        <div>
          <button className="command" type="button" onClick={() => scrollColumns(-1)} aria-label="보유 목록 왼쪽 열 보기">← 이전 열</button>
          <button className="command" type="button" onClick={() => scrollColumns(1)} aria-label="보유 목록 오른쪽 열 보기">다음 열 →</button>
        </div>
      </div>
      <div className="table-scroll" ref={tableScroll} role="region" aria-label="보유 목록 전체 열" tabIndex={0}>
        <style>{frozenOffsets.map((left, index) => `.holdings-panel :is(th, td):nth-child(${index + 1}) { position: sticky; inset-inline-start: ${left}px; z-index: 2; background: var(--frozen-cell-bg, var(--surface-panel)); box-shadow: 1px 0 var(--border-default); }`).join("\n")}</style>
        <table>
          <caption>현재 보유 종목과 리밸런싱 계산 결과</caption>
          <thead>
            <tr>
              <th scope="col">계좌</th>
              <th aria-sort={ariaSort(sortState, "productName")} scope="col">
                <SortHeaderButton
                  label="종목명"
                  direction={sortState.direction}
                  isActive={sortState.key === "productName"}
                  onToggle={() => toggleSort("productName")}
                />
              </th>
              <th scope="col">코드</th>
              <th scope="col">통화</th>
              <th scope="col">현재가</th>
              <th scope="col">보유 수량</th>
              <th scope="col">평균 매입가</th>
              <th aria-sort={ariaSort(sortState, "investedValue")} scope="col">
                <SortHeaderButton
                  label="매입 금액"
                  direction={sortState.direction}
                  isActive={sortState.key === "investedValue"}
                  onToggle={() => toggleSort("investedValue")}
                />
              </th>
              <th aria-sort={ariaSort(sortState, "marketValue")} scope="col">
                <SortHeaderButton
                  label="평가 금액"
                  direction={sortState.direction}
                  isActive={sortState.key === "marketValue"}
                  onToggle={() => toggleSort("marketValue")}
                />
              </th>
              <th aria-sort={ariaSort(sortState, "profit")} scope="col">
                <SortHeaderButton
                  label="손익"
                  direction={sortState.direction}
                  isActive={sortState.key === "profit"}
                  onToggle={() => toggleSort("profit")}
                />
              </th>
              <th aria-sort={ariaSort(sortState, "returnPercent")} scope="col">
                <SortHeaderButton
                  label="수익률"
                  direction={sortState.direction}
                  isActive={sortState.key === "returnPercent"}
                  onToggle={() => toggleSort("returnPercent")}
                />
              </th>
              <th aria-sort={ariaSort(sortState, "currentPercent")} scope="col">
                <SortHeaderButton
                  label="현재 비율"
                  direction={sortState.direction}
                  isActive={sortState.key === "currentPercent"}
                  onToggle={() => toggleSort("currentPercent")}
                />
              </th>
              <th aria-sort={ariaSort(sortState, "targetPercent")} scope="col">
                <SortHeaderButton
                  label="목표 비율"
                  direction={sortState.direction}
                  isActive={sortState.key === "targetPercent"}
                  onToggle={() => toggleSort("targetPercent")}
                />
              </th>
              <th scope="col">매매 가이드</th>
              <th scope="col">분석 소견</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <HoldingTableRow
                accounts={accounts}
                key={`${row.accountId}-${row.symbol}`}
                row={row}
                onDeleteHolding={onDeleteHolding}
                onEditHolding={setDialogState}
                onOpenMarketDetail={onOpenMarketDetail}
              />
            ))}
          </tbody>
        </table>
      </div>
      {dialogState !== null ? (
        <HoldingDialog
          state={dialogState}
          accounts={accounts}
          holdings={rows}
          instruments={instruments}
          targets={targets}
          onClose={() => setDialogState(null)}
          onAddHolding={onAddHolding}
          onUpdateHolding={onUpdateHolding}
        />
      ) : null}
    </section>
  );
}
