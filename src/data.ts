import type { Account, CashPosition, Holding, TargetAsset } from "./types";

export const accounts: readonly Account[] = [
  { id: "pension-future", name: "연금 저축 펀드", broker: "미래" },
  { id: "irp-future", name: "IRP", broker: "미래" },
  { id: "global-shinhan", name: "종합계좌", broker: "신한-469" },
];

export const targetAssets: readonly TargetAsset[] = [
  { accountId: "pension-future", assetClass: "S&P 500", symbol: "379800", productName: "KODEX 미국 S&P500 TR", suitability: "IRP/연금저축", targetPercent: 30 },
  { accountId: "pension-future", assetClass: "Nasdaq 100", symbol: "379810", productName: "KODEX 미국나스닥100 TR", suitability: "IRP/연금저축", targetPercent: 40 },
  { accountId: "pension-future", assetClass: "Bonds", symbol: "453850", productName: "ACE 미국30년 국채액티브(H)", suitability: "IRP", targetPercent: 10 },
  { accountId: "pension-future", assetClass: "Nasdaq 100", symbol: "483340", productName: "ACE 구글밸류체인액티브", suitability: "IRP/연금저축", targetPercent: 20 },
  { accountId: "irp-future", assetClass: "S&P 500", symbol: "379800", productName: "KODEX 미국 S&P500 TR", suitability: "IRP/연금저축", targetPercent: 30 },
  { accountId: "irp-future", assetClass: "Nasdaq 100", symbol: "379810", productName: "KODEX 미국나스닥100 TR", suitability: "IRP/연금저축", targetPercent: 30 },
  { accountId: "irp-future", assetClass: "Bonds", symbol: "453850", productName: "ACE 미국30년 국채액티브(H)", suitability: "IRP", targetPercent: 20 },
  { accountId: "irp-future", assetClass: "Bonds", symbol: "329750", productName: "TIGER 미국달러단기채권액티브", suitability: "IRP", targetPercent: 20 },
  { accountId: "global-shinhan", assetClass: "Nasdaq 100", symbol: "QQQ", productName: "Invesco QQQ Trust", suitability: "-", targetPercent: 20 },
  { accountId: "global-shinhan", assetClass: "S&P 500", symbol: "JEPQ", productName: "JPMorgan Nasdaq Equity Premium Income ETF", suitability: "-", targetPercent: 5 },
  { accountId: "global-shinhan", assetClass: "Gold", symbol: "IAU", productName: "iShares Gold Trust", suitability: "-", targetPercent: 10 },
  { accountId: "global-shinhan", assetClass: "Bonds", symbol: "IEF", productName: "iShares 7-10Y Treasury bond", suitability: "-", targetPercent: 7.5 },
  { accountId: "global-shinhan", assetClass: "Bonds", symbol: "TLT", productName: "20+Y", suitability: "-", targetPercent: 7.5 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VTI", productName: "Vanguard Total Stock Market", suitability: "-", targetPercent: 5 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VEA", productName: "Vanguard FTSE Developed Markets", suitability: "-", targetPercent: 10 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VWO", productName: "Vanguard FTSE Emerging Markets", suitability: "-", targetPercent: 5 },
  { accountId: "global-shinhan", assetClass: "Commodities", symbol: "DBC", productName: "Invesco DB Commodity Tracking", suitability: "-", targetPercent: 5 },
  { accountId: "global-shinhan", assetClass: "Dow Jones Dividend", symbol: "SCHD", productName: "Schwab US Dividend Equity", suitability: "-", targetPercent: 15 },
];

export const holdings: readonly Holding[] = [
  { accountId: "pension-future", assetClass: "S&P 500", symbol: "379800", productName: "KODEX 미국 S&P500 TR", suitability: "IRP/연금저축", currency: "KRW", currentPrice: 23485, quantity: 47, averagePrice: 20193 },
  { accountId: "pension-future", assetClass: "Nasdaq 100", symbol: "379810", productName: "KODEX 미국나스닥100 TR", suitability: "IRP/연금저축", currency: "KRW", currentPrice: 26205, quantity: 133, averagePrice: 23659 },
  { accountId: "pension-future", assetClass: "Bonds", symbol: "453850", productName: "ACE 미국30년 국채액티브(H)", suitability: "IRP", currency: "KRW", currentPrice: 7150, quantity: 71, averagePrice: 7667 },
  { accountId: "pension-future", assetClass: "Nasdaq 100", symbol: "483340", productName: "ACE 구글밸류체인액티브", suitability: "IRP/연금저축", currency: "KRW", currentPrice: 20545, quantity: 53, averagePrice: 16365 },
  { accountId: "irp-future", assetClass: "S&P 500", symbol: "379800", productName: "KODEX 미국 S&P500 TR", suitability: "IRP/연금저축", currency: "KRW", currentPrice: 23485, quantity: 38, averagePrice: 19867 },
  { accountId: "irp-future", assetClass: "Nasdaq 100", symbol: "379810", productName: "KODEX 미국나스닥100 TR", suitability: "IRP/연금저축", currency: "KRW", currentPrice: 26205, quantity: 28, averagePrice: 21128 },
  { accountId: "irp-future", assetClass: "Dow Jones Dividend", symbol: "458730", productName: "TIGER 미국배당다우존스", suitability: "ISA", currency: "KRW", currentPrice: 15040, quantity: 36, averagePrice: 11950 },
  { accountId: "irp-future", assetClass: "Bonds", symbol: "453850", productName: "ACE 미국30년 국채액티브(H)", suitability: "IRP", currency: "KRW", currentPrice: 7150, quantity: 18, averagePrice: 7604 },
  { accountId: "irp-future", assetClass: "Bonds", symbol: "329750", productName: "TIGER 미국달러단기채권액티브", suitability: "IRP", currency: "KRW", currentPrice: 12845, quantity: 25, averagePrice: 12819 },
  { accountId: "global-shinhan", assetClass: "Nasdaq 100", symbol: "QQQ", productName: "Invesco QQQ Trust", suitability: "-", currency: "USD", currentPrice: 709.24, quantity: 1, averagePrice: 280.69 },
  { accountId: "global-shinhan", assetClass: "Gold", symbol: "IAU", productName: "iShares Gold Trust", suitability: "-", currency: "USD", currentPrice: 82.55, quantity: 5, averagePrice: 35.348 },
  { accountId: "global-shinhan", assetClass: "Bonds", symbol: "IEF", productName: "iShares 7-10Y Treasury bond", suitability: "-", currency: "USD", currentPrice: 92.18, quantity: 2, averagePrice: 118.91 },
  { accountId: "global-shinhan", assetClass: "Bonds", symbol: "TLT", productName: "20+Y", suitability: "-", currency: "USD", currentPrice: 81.95, quantity: 4, averagePrice: 123.1 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VTI", productName: "Vanguard Total Stock Market", suitability: "-", currency: "USD", currentPrice: 376.88, quantity: 1, averagePrice: 182 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VEA", productName: "Vanguard FTSE Developed Markets", suitability: "-", currency: "USD", currentPrice: 72.59, quantity: 2, averagePrice: 43.925 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VWO", productName: "Vanguard FTSE Emerging Markets", suitability: "-", currency: "USD", currentPrice: 60.77, quantity: 2, averagePrice: 44.9875 },
  { accountId: "global-shinhan", assetClass: "Commodities", symbol: "DBC", productName: "Invesco DB Commodity Tracking", suitability: "-", currency: "USD", currentPrice: 31.93, quantity: 4, averagePrice: 15.41 },
  { accountId: "global-shinhan", assetClass: "Dow Jones Dividend", symbol: "SCHD", productName: "Schwab US Dividend Equity", suitability: "-", currency: "USD", currentPrice: 35.01, quantity: 14, averagePrice: 26.3364 },
];

export const cashPositions: readonly CashPosition[] = [
  { accountId: "pension-future", currency: "KRW", amount: 12791 },
  { accountId: "irp-future", currency: "KRW", amount: 3502 },
  { accountId: "global-shinhan", currency: "KRW", amount: 45749851 },
];
