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
                <button className="icon-command" type="button" onClick={() => onEditTarget(row)}>
                  <Pencil size={16} aria-hidden="true" />
                  수정
                </button>
                <button
                  className="icon-command danger"
                  type="button"
                  onClick={() => onDeleteTargetAllocation({ accountId: row.accountId, symbol: row.symbol })}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  삭제
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}
