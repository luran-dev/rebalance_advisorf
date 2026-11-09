import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { PortfolioState } from "./accountState";
import { savePortfolioState } from "./appApi";
import { PortfolioSaveQueue } from "./portfolioSaveQueue";

export type SaveStatus = "saved" | "saving" | "error";

export const usePortfolioState = (initialPortfolio: PortfolioState): {
  readonly portfolio: PortfolioState;
  readonly setPortfolio: Dispatch<SetStateAction<PortfolioState>>;
  readonly saveStatus: SaveStatus;
  readonly lastSavedAt: Date | null;
  readonly saveNow: () => Promise<boolean>;
} => {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveQueue = useRef(new PortfolioSaveQueue());
  const latestSave = useRef(0);

  const saveNow = useCallback(async (): Promise<boolean> => {
    const saveId = latestSave.current + 1;
    latestSave.current = saveId;
    setSaveStatus("saving");
    const request = saveQueue.current.enqueue(() => savePortfolioState(portfolio));
    try {
      await request;
      setLastSavedAt(new Date());
      if (latestSave.current === saveId) {
        setSaveStatus("saved");
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (latestSave.current === saveId) {
          setSaveStatus("error");
        }
        return false;
      }
      throw error;
    }
  }, [portfolio]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void saveNow();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [saveNow]);

  return { portfolio, setPortfolio, saveStatus, lastSavedAt, saveNow };
};
