import { TrendingUp } from "lucide-react";
import { formatPercent } from "../format";
import type { AssetSummary, RiskSummary } from "../types";
import { RiskDistributionChart } from "./RiskDistributionChart";

const palette = [
  "var(--accent-orange)",
  "var(--chart-leaf)",
  "var(--chart-gold)",
  "var(--chart-coral)",
  "var(--chart-sky)",
  "var(--text-primary)",
  "var(--signal-buy)",
  "var(--signal-sell)",
  "var(--surface-subtle)",
] as const;

export function AllocationDonut({
  summary,
  riskSummary,
}: {
  readonly summary: readonly AssetSummary[];
  readonly riskSummary: readonly RiskSummary[];
}) {
  let cursor = 0;
  const gradient = summary
    .map((item, index) => {
      const start = cursor;
      const end = cursor + item.percent;
      cursor = end;
      const color = palette[index % palette.length] ?? "var(--surface-subtle)";
      return `${color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <section className="panel allocation-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">자산 현황</p>
          <h2>종합 포트폴리오</h2>
        </div>
        <TrendingUp size={22} aria-hidden="true" />
      </div>
      <div className="allocation-layout">
        <div className="donut" style={{ background: `conic-gradient(${gradient})` }} aria-label="자산 비중 도넛 차트">
          <div className="donut-hole">
            <span>현금</span>
            <strong>{formatPercent(summary.find((item) => item.assetClass === "현금")?.percent ?? 0)}</strong>
          </div>
        </div>
        <div className="legend">
          {summary.map((item, index) => (
            <div className="legend-row" key={item.assetClass}>
              <span className="swatch" style={{ backgroundColor: palette[index % palette.length] ?? "var(--surface-subtle)" }} />
              <span>{item.assetClass}</span>
              <strong>{formatPercent(item.percent)}</strong>
            </div>
          ))}
        </div>
      </div>
      <RiskDistributionChart summary={riskSummary} />
    </section>
  );
}
