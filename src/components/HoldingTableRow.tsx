import { Pencil, Trash2 } from "lucide-react";
import { formatKrw, formatNumber, formatPercent } from "../format";
import { buildHoldingOpinion } from "../holdingOpinion";
import type { Account, HoldingKey, HoldingRow, MarketDetailSubject } from "../types";
import type { HoldingDialogState } from "./HoldingDialog";

const directionLabel = {
  buy: "사기",
  sell: "팔기",
  hold: "유지",
} as const;

export function HoldingTableRow({
  row,
  accounts,
  onEditHolding,
  onDeleteHolding,
  onOpenMarketDetail,
}: {
  readonly row: HoldingRow;
  readonly accounts: readonly Account[];
  readonly onEditHolding: (state: HoldingDialogState) => void;
  readonly onDeleteHolding: (key: HoldingKey) => void;
  readonly onOpenMarketDetail: (subject: MarketDetailSubject) => void;
}) {
  const accountName = accounts.find((account) => account.id === row.accountId)?.name ?? row.accountId;
  const opinion = buildHoldingOpinion(row);

  return (
    <tr>
      <td>{accountName}</td>
      <td>
        <button
          className="asset-link"
          type="button"
          onClick={() =>
            onOpenMarketDetail({
              accountId: row.accountId,
              accountName,
              assetClass: row.assetClass,
              symbol: row.symbol,
              productName: row.productName,
              suitability: row.suitability,
              currency: row.currency,
              currentPercent: row.currentPercent,
              targetPercent: row.targetPercent,
              returnPercent: row.returnPercent,
              marketValue: row.marketValue,
            })
          }
        >
          {row.productName}
        </button>
      </td>
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
        <div className={`holding-opinion holding-opinion-${opinion.tone}`}>
          <strong>{opinion.action}</strong>
          <span>{opinion.reason}</span>
          <small>{opinion.details.join(" · ")}</small>
        </div>
      </td>
      <td>
        <div className="table-actions">
          <button
            className="icon-command icon-only"
            type="button"
            onClick={() => onEditHolding({ kind: "edit", row })}
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
  );
}
