import { TableProperties } from "lucide-react";
import { formatKrw, formatNumber, formatPercent } from "../format";
import type { Account, HoldingRow } from "../types";

const directionLabel = {
  buy: "사기",
  sell: "팔기",
  hold: "유지",
} as const;

export function HoldingsTable({ accounts, rows }: { readonly accounts: readonly Account[]; readonly rows: readonly HoldingRow[] }) {
  return (
    <section className="panel table-panel holdings-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">주식 리스트</p>
          <h2>현재 보유와 매매 가이드</h2>
        </div>
        <TableProperties size={22} aria-hidden="true" />
      </div>
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
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.accountId}-${row.symbol}-${row.quantity}`}>
                <td>{accounts.find((account) => account.id === row.accountId)?.name ?? row.accountId}</td>
                <td>{row.productName}</td>
                <td className="ticker">{row.symbol}</td>
                <td>{row.currency === "KRW" ? "원" : "달러"}</td>
                <td>{formatNumber(row.currentPrice)}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
