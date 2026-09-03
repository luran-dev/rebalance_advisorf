import { Columns3, PanelLeft } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type ResizableAnalysisGridProps = {
  readonly allocationPercent: number;
  readonly allocationPanel: ReactNode;
  readonly strategyPanel: ReactNode;
  readonly onAllocationPercentChange: (percent: number) => void;
};

export function ResizableAnalysisGrid({
  allocationPercent,
  allocationPanel,
  strategyPanel,
  onAllocationPercentChange,
}: ResizableAnalysisGridProps) {
  const strategyPercent = 100 - allocationPercent;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `minmax(280px, ${allocationPercent}fr) minmax(460px, ${strategyPercent}fr)`,
  };

  return (
    <section className="analysis-workspace" aria-label="포트폴리오 분석 패널">
      <div className="panel-size-control" aria-label="분석 패널 폭 조절">
        <PanelLeft size={18} aria-hidden="true" />
        <span>종합 포트폴리오</span>
        <input
          type="range"
          min={28}
          max={56}
          step={1}
          value={allocationPercent}
          aria-label="종합 포트폴리오 패널 가로폭"
          onChange={(event) => onAllocationPercentChange(event.currentTarget.valueAsNumber)}
        />
        <span>목표 비중</span>
        <Columns3 size={18} aria-hidden="true" />
      </div>
      <div className="analysis-grid analysis-grid-resizable" style={gridStyle}>
        {allocationPanel}
        {strategyPanel}
      </div>
    </section>
  );
}
