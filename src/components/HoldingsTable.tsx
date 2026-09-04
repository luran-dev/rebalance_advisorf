import { Pencil, Plus, RefreshCw, TableProperties, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatKrw, formatNumber, formatPercent } from "../format";
import type { HoldingSelection, HoldingUpdate } from "../holdingState";
import type { Account, AccountId, HoldingKey, HoldingRow, Instrument, TargetAsset } from "../types";
import { HoldingDialog, type HoldingDialogState } from "./HoldingDialog";

const directionLabel = {
  buy: "사기",
  sell: "팔기",
  hold: "유지",
} as const;

export function HoldingsTable({
  accounts,
  activeAccount,
  rows,
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
}: {
  readonly accounts: readonly Account[];
  readonly activeAccount: AccountId | "all";
  readonly rows: readonly HoldingRow[];
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
}) {
  const [dialogState, setDialogState] = useState<HoldingDialogState | null>(null);
  const canAddInCurrentView = activeAccount !== "all";

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
      <div className="table-scroll">
        <table>
          <caption>현재 보유 종목과 리밸런싱 계산 결과</caption>
          <thead>
            <tr>
              <th scope="col">계좌</th>
              <th scope="col">종목명</th>
              <th scope="col">코드</th>
              <th scope="col">통화</th>
              <th scope="col">현재가</th>
              <th scope="col">보유 수량</th>
              <th scope="col">평균 매입가</th>
              <th scope="col">매입 금액</th>
              <th scope="col">평가 금액</th>
              <th scope="col">손익</th>
              <th scope="col">수익률</th>
              <th scope="col">현재 비율</th>
              <th scope="col">목표 비율</th>
              <th scope="col">매매 가이드</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.accountId}-${row.symbol}`}>
                <td>{accounts.find((account) => account.id === row.accountId)?.name ?? row.accountId}</td>
                <td>{row.productName}</td>
                <td className="ticker">{row.symbol}</td>
                <td>{row.currency}</td>
                <td title={row.priceUpdatedAt ? `${row.priceSource ?? "외부 시세"} · ${row.priceUpdatedAt}` : "시세 갱신 전"}>
                  {formatNumber(row.currentPrice)}
                </td>
                <td>{formatNumber(row.quantity)}</td>
                <td>{formatNumber(row.averagePrice)}</td>
                <td>{formatKrw(row.investedValue)}</td>
                <td>{formatKrw(row.marketValue)}</td>
                <td className={row.profit >= 0 ? "gain" : "loss"}>{formatKrw(row.profit)}</td>
                <td className={row.returnPercent >= 0 ? "gain" : "loss"}>{formatPercent(row.returnPercent)}</td>
                <td>{formatPercent(row.currentPercent)}</td>
                <td>{formatPercent(row.targetPercent)}</td>
                <td>
                  <span className={`trade trade-${row.direction}`}>
                    {Math.abs(row.tradeQuantity)}개 {directionLabel[row.direction]}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="icon-command icon-only"
                      type="button"
                      onClick={() => setDialogState({ kind: "edit", row })}
                      aria-label={`${row.productName} 보유 항목 수정`}
                      title="수정"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-command icon-only danger"
                      type="button"
                      onClick={() => onDeleteHolding({ accountId: row.accountId, symbol: row.symbol })}
                      aria-label={`${row.productName} 보유 항목 삭제`}
                      title="삭제"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
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
