import type { HoldingRow, MarketDetailSubject } from "./types";

export const enrichMarketDetailSubject = (
  subject: MarketDetailSubject,
  rows: readonly HoldingRow[],
): MarketDetailSubject => {
  const holdingRow = rows.find((row) => row.accountId === subject.accountId && row.symbol === subject.symbol);
  return holdingRow === undefined
    ? subject
    : {
        ...subject,
        assetClass: holdingRow.assetClass,
        productName: holdingRow.productName,
        suitability: holdingRow.suitability,
        currency: holdingRow.currency,
        currentPercent: holdingRow.currentPercent,
        targetPercent: holdingRow.targetPercent,
        returnPercent: holdingRow.returnPercent,
        marketValue: holdingRow.marketValue,
      };
};
