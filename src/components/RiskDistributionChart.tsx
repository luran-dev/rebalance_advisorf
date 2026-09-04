import { ShieldAlert } from "lucide-react";
import { formatKrw, formatPercent } from "../format";
import type { RiskSummary } from "../types";

const colorForTone = (tone: RiskSummary["riskTone"]): string => {
  switch (tone) {
    case "gain":
      return "var(--signal-good)";
    case "warning":
      return "var(--signal-warn)";
    case "loss":
      return "var(--signal-sell)";
    case "neutral":
      return "var(--text-muted)";
  }
};

export function RiskDistributionChart({ summary }: { readonly summary: readonly RiskSummary[] }) {
  let cursor = 0;
  const gradient = summary
    .map((item) => {
      const start = cursor;
      const end = cursor + item.percent;
      cursor = end;
      return `${colorForTone(item.riskTone)} ${start}% ${end}%`;
    })
    .join(", ");
  const background = summary.length === 0 ? "var(--surface-subtle)" : `linear-gradient(90deg, ${gradient})`;

  return (
    <section className="risk-distribution" aria-label="위험도 분포">
      <div className="risk-distribution-heading">
        <div>
          <p className="eyebrow">Risk exposure</p>
          <h3>위험도 분포</h3>
        </div>
        <ShieldAlert size={18} aria-hidden="true" />
      </div>
      <div className="risk-stack" style={{ background }} aria-hidden="true" />
      {summary.length === 0 ? (
        <p className="target-hint risk-empty">보유 종목이 있으면 위험도 분포를 계산합니다.</p>
      ) : (
        <div className="legend risk-legend">
          {summary.map((item) => (
            <div className="legend-row" key={item.riskLabel}>
              <span className="swatch" style={{ backgroundColor: colorForTone(item.riskTone) }} />
              <span>{item.riskLabel}</span>
              <strong>{formatPercent(item.percent)}</strong>
              <small>{formatKrw(item.marketValue)}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
