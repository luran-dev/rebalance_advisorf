import { Pencil, Trash2 } from "lucide-react";
import type { Account, Instrument, TargetAllocationKey, TargetAsset } from "../types";

export function TargetAllocationRows({
  rows,
  accounts,
  instruments,
  onEditTarget,
  onDeleteTargetAllocation,
}: {
  readonly rows: readonly TargetAsset[];
  readonly accounts: readonly Account[];
  readonly instruments: readonly Instrument[];
  readonly onEditTarget: (target: TargetAsset) => void;
  readonly onDeleteTargetAllocation: (key: TargetAllocationKey) => void;
}) {
  return (
    <>
      {rows.map((row) => {
        const instrument = instruments.find((item) => item.symbol === row.symbol);
        const rowName = instrument?.name ?? row.productName;
        const rowCategory = instrument?.category ?? row.assetClass;

        return (
          <tr key={`${row.accountId}-${row.symbol}`}>
            <td>{accounts.find((account) => account.id === row.accountId)?.name ?? row.accountId}</td>
            <td>{rowCategory}</td>
            <td className="ticker">{row.symbol}</td>
            <td>{rowName}</td>
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
