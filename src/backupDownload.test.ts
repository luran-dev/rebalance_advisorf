import { describe, expect, it } from "vitest";
import { backupFileName } from "./backupDownload";

describe("backup file download", () => {
  it("Given a backup time When building the file name Then it includes date hour and minute", () => {
    const fileName = backupFileName(new Date(2026, 8, 5, 9, 7));

    expect(fileName).toBe("rebalance-advisor-backup-2026-09-05-09-07.json");
  });
});
