import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { backupFileName, saveBackupJson, type BackupSaveResult } from "../backupDownload";
import { createPortfolioBackup, parsePortfolioBackup } from "../portfolioBackup";
import type { PortfolioState } from "../accountState";

const backupStatusText: Readonly<Record<BackupSaveResult, string>> = {
  saved: "지정한 위치에 현재 데이터 백업 파일을 저장했습니다.",
  downloaded: "브라우저 기본 다운로드 위치에 현재 데이터 백업 파일을 만들었습니다.",
  canceled: "백업 저장을 취소했습니다.",
};

export function DataManager({
  portfolio,
  onRestore,
  onReset,
}: {
  readonly portfolio: PortfolioState;
  readonly onRestore: (state: PortfolioState) => void;
  readonly onReset: () => void;
}) {
  const [status, setStatus] = useState("백업 파일을 내보내거나 가져올 수 있습니다.");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const exportBackup = async () => {
    try {
      const result = await saveBackupJson(backupFileName(), createPortfolioBackup(portfolio));
      setStatus(backupStatusText[result]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "백업 파일을 저장하지 못했습니다.");
    }
  };

  const importBackup = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }
    try {
      const restored = parsePortfolioBackup(await file.text());
      onRestore(restored);
      setStatus(`${file.name} 파일에서 데이터를 복구했습니다.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "백업 파일을 복구하지 못했습니다.");
    }
  };

  const resetData = () => {
    if (!window.confirm("현재 데이터를 초기 샘플 데이터로 교체할까요?")) {
      return;
    }
    onReset();
    setStatus("초기 샘플 데이터로 되돌렸습니다.");
  };

  return (
    <section className="panel data-manager">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">데이터 관리</p>
          <h2>백업/복구</h2>
        </div>
      </div>
      <div className="data-manager-body">
        <div className="data-action-grid">
          <button className="command command-primary" type="button" onClick={() => void exportBackup()}>
            <Download size={16} aria-hidden="true" />
            백업 내보내기
          </button>
          <button className="command" type="button" onClick={() => inputRef.current?.click()}>
            <Upload size={16} aria-hidden="true" />
            백업 가져오기
          </button>
          <button className="command command-ghost" type="button" onClick={resetData}>
            <RotateCcw size={16} aria-hidden="true" />
            초기 데이터 복원
          </button>
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          aria-label="백업 파일 선택"
          onChange={(event) => {
            void importBackup(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <p className="target-hint data-manager-status">{status}</p>
      </div>
    </section>
  );
}
