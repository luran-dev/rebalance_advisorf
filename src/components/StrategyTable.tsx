import { SlidersHorizontal } from "lucide-react";
import type { Account, AccountId, SymbolCode, TargetAsset } from "../types";

export function StrategyTable({
  accounts,
  activeAccount,
  targets,
  onTargetPercentChange,
}: {
  readonly accounts: readonly Account[];
  readonly activeAccount: AccountId | "all";
  readonly targets: readonly TargetAsset[];
  readonly onTargetPercentChange: (accountId: AccountId, symbol: SymbolCode, targetPercent: number) => void;
}) {
  const rows = targets.filter((target) => activeAccount === "all" || target.accountId === activeAccount);

  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">투자 전략 설정</p>
          <h2>목표 비중</h2>
        </div>
        <SlidersHorizontal size={22} aria-hidden="true" />
      </div>
      <div className="table-scroll">
        <table>
          <caption>계좌별 목표 투자 비중</caption>
          <thead>
            <tr>
              <th scope="col">계좌</th>
              <th scope="col">자산군</th>
              <th scope="col">종목 코드</th>
              <th scope="col">상품명</th>
              <th scope="col">적합성</th>
              <th scope="col">목표 비율</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.accountId}-${row.symbol}`}>
                <td>{accounts.find((account) => account.id === row.accountId)?.name ?? row.accountId}</td>
                <td>{row.assetClass}</td>
                <td className="ticker">{row.symbol}</td>
                <td>{row.productName}</td>
                <td>{row.suitability}</td>
                <td>
                  <label className="sr-only" htmlFor={`target-${row.accountId}-${row.symbol}`}>
                    {row.productName} 목표 비율
                  </label>
                  <input
                    id={`target-${row.accountId}-${row.symbol}`}
                    type="number"
                    value={row.targetPercent}
                    min="0"
                    max="100"
                    step="0.5"
                    onChange={(event) => onTargetPercentChange(row.accountId, row.symbol, Number(event.currentTarget.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
