import { Pencil, Trash2 } from "lucide-react";
import type { Account, Instrument, MarketDetailSubject, TargetAllocationKey, TargetAsset } from "../types";

export function TargetAllocationRows({
  rows,
  accounts,
  instruments,
  onEditTarget,
  onDeleteTargetAllocation,
  onOpenMarketDetail,
}: {
  readonly rows: readonly TargetAsset[];
  readonly accounts: readonly Account[];
  readonly instruments: readonly Instrument[];
  readonly onEditTarget: (target: TargetAsset) => void;
  readonly onDeleteTargetAllocation: (key: TargetAllocationKey) => void;
  readonly onOpenMarketDetail: (subject: MarketDetailSubject) => void;
}) {
  return (
    <>
      {rows.map((row) => {
        const instrument = instruments.find((item) => item.symbol === row.symbol);
        const rowName = instrument?.name ?? row.productName;
        const rowCategory = instrument?.category ?? row.assetClass;
        const accountName = accounts.find((account) => account.id === row.accountId)?.name ?? row.accountId;
        const currency = instrument?.currency ?? "KRW";
        const riskTone = instrument?.riskTone ?? "neutral";
        const riskLabel = instrument?.riskLabel ?? "미계산";

        return (
          <tr key={`${row.accountId}-${row.symbol}`}>
            <td>{accountName}</td>
            <td>{rowCategory}</td>
            <td>
              <span className={`risk-badge risk-badge-${riskTone}`}>{riskLabel}</span>
            </td>
            <td className="ticker">{row.symbol}</td>
            <td>
              <button
                className="asset-link"
                type="button"
                onClick={() =>
                  onOpenMarketDetail({
                    accountId: row.accountId,
                    accountName,
                    assetClass: rowCategory,
                    symbol: row.symbol,
                    productName: rowName,
                    suitability: row.suitability,
                    currency,
                    targetPercent: row.targetPercent,
                  })
                }
              >
                {rowName}
              </button>
            </td>
            <td>{row.suitability}</td>
            <td>{row.targetPercent.toFixed(1)}%</td>
            <td>
              <div className="table-actions">
                <button
                  className="icon-command icon-only"
                  type="button"
                  onClick={() => onEditTarget(row)}
                  aria-label={`${rowName} 목표 비중 수정`}
                  title="수정"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  className="icon-command icon-only danger"
                  type="button"
                  onClick={() => onDeleteTargetAllocation({ accountId: row.accountId, symbol: row.symbol })}
                  aria-label={`${rowName} 목표 비중 삭제`}
                  title="삭제"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}
