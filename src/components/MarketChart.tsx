import { useState } from "react";
import type { PointerEvent } from "react";
import { formatNumber } from "../format";
import type { MarketHistoryItem } from "../types";

const chartWidth = 720;
const chartHeight = 260;
const chartPadding = 28;

const chartPoint = (item: MarketHistoryItem, index: number, items: readonly MarketHistoryItem[]) => {
  const closes = items.map((entry) => entry.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const spread = max - min || 1;
  const xRange = chartWidth - chartPadding * 2;
  const yRange = chartHeight - chartPadding * 2;
  const x = chartPadding + (items.length <= 1 ? 0 : (index / (items.length - 1)) * xRange);
  const y = chartPadding + (1 - (item.close - min) / spread) * yRange;
  return { x, y };
};

const buildPath = (items: readonly MarketHistoryItem[]): string =>
  items
    .map((item, index) => {
      const point = chartPoint(item, index, items);
      return `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");

export function MarketChart({ items }: { readonly items: readonly MarketHistoryItem[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return <div className="market-chart-empty">차트 데이터 없음</div>;
  }

  const first = items[0];
  const last = items.at(-1);
  const firstClose = first?.close ?? 0;
  const lastClose = last?.close ?? 0;
  const isGain = lastClose >= firstClose;
  const points = items.map((item, index) => chartPoint(item, index, items));
  const lastPoint = points.at(-1);
  const hoveredItem = hoveredIndex === null ? undefined : items[hoveredIndex];
  const hoveredPoint = hoveredIndex === null ? undefined : points[hoveredIndex];

  const updateHoveredPoint = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - box.left) / box.width) * chartWidth;
    const xRange = chartWidth - chartPadding * 2;
    const ratio = Math.min(1, Math.max(0, (relativeX - chartPadding) / xRange));
    setHoveredIndex(Math.round(ratio * (items.length - 1)));
  };

  return (
    <div className="market-chart" role="img" aria-label="선택한 기간의 종가 흐름">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        focusable="false"
        onPointerMove={updateHoveredPoint}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <line x1={chartPadding} y1={chartPadding} x2={chartPadding} y2={chartHeight - chartPadding} />
        <line
          x1={chartPadding}
          y1={chartHeight - chartPadding}
          x2={chartWidth - chartPadding}
          y2={chartHeight - chartPadding}
        />
        <path className={isGain ? "chart-line gain-line" : "chart-line loss-line"} d={buildPath(items)} />
        {hoveredPoint && hoveredItem ? (
          <g className="chart-hover-marker">
            <line x1={hoveredPoint.x} y1={chartPadding} x2={hoveredPoint.x} y2={chartHeight - chartPadding} />
            <line x1={chartPadding} y1={hoveredPoint.y} x2={chartWidth - chartPadding} y2={hoveredPoint.y} />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" />
          </g>
        ) : null}
        {lastPoint ? <circle cx={lastPoint.x} cy={lastPoint.y} r="5" /> : null}
      </svg>
      {hoveredPoint && hoveredItem ? (
        <div
          className="chart-tooltip"
          style={{
            insetInlineStart: `${(hoveredPoint.x / chartWidth) * 100}%`,
            insetBlockStart: `${(hoveredPoint.y / chartHeight) * 100}%`,
          }}
        >
          <span>{hoveredItem.date}</span>
          <strong>{formatNumber(hoveredItem.close)}</strong>
        </div>
      ) : null}
      <div className="chart-foot">
        <span>{first?.date ?? "-"}</span>
        <strong>{last?.date ?? "-"}</strong>
      </div>
    </div>
  );
}
