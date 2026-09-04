import type { Account, CashPosition, Holding, Instrument, TargetAsset } from "./types";

export const accounts: readonly Account[] = [
  { id: "pension-future", name: "연금 저축 펀드", broker: "미래" },
  { id: "irp-future", name: "IRP", broker: "미래" },
  { id: "global-shinhan", name: "종합계좌", broker: "신한-469" },
];

export const instruments: readonly Instrument[] = [
  { name: "KODEX 미국 S&P500 TR", symbol: "379800", country: "한국", currency: "KRW", category: "S&P500" },
  { name: "KODEX 미국나스닥100 TR", symbol: "379810", country: "한국", currency: "KRW", category: "나스닥100" },
  { name: "ACE 미국30년 국채액티브(H)", symbol: "453850", country: "한국", currency: "KRW", category: "채권" },
  { name: "ACE 구글밸류체인액티브", symbol: "483340", country: "한국", currency: "KRW", category: "국내 ETF" },
  { name: "TIGER 미국달러단기채권액티브", symbol: "329750", country: "한국", currency: "KRW", category: "채권" },
  { name: "TIGER 미국배당다우존스", symbol: "458730", country: "한국", currency: "KRW", category: "다우존스" },
  { name: "Invesco QQQ Trust", symbol: "QQQ", country: "미국", currency: "USD", category: "해외 ETF" },
  { name: "JPMorgan Nasdaq Equity Premium Income ETF", symbol: "JEPQ", country: "미국", currency: "USD", category: "해외 ETF" },
  { name: "iShares Gold Trust", symbol: "IAU", country: "미국", currency: "USD", category: "금" },
  { name: "iShares 7-10Y Treasury bond", symbol: "IEF", country: "미국", currency: "USD", category: "채권" },
  { name: "20+Y", symbol: "TLT", country: "미국", currency: "USD", category: "채권" },
  { name: "Vanguard Total Stock Market", symbol: "VTI", country: "미국", currency: "USD", category: "해외 ETF" },
  { name: "Vanguard FTSE Developed Markets", symbol: "VEA", country: "미국", currency: "USD", category: "해외 ETF" },
  { name: "Vanguard FTSE Emerging Markets", symbol: "VWO", country: "미국", currency: "USD", category: "해외 ETF" },
  { name: "Invesco DB Commodity Tracking", symbol: "DBC", country: "미국", currency: "USD", category: "해외 ETF" },
  { name: "Schwab US Dividend Equity", symbol: "SCHD", country: "미국", currency: "USD", category: "해외 ETF" },
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
  { accountId: "global-shinhan", assetClass: "Nasdaq 100", symbol: "QQQ", productName: "Invesco QQQ Trust", suitability: "일반", targetPercent: 20 },
  { accountId: "global-shinhan", assetClass: "S&P 500", symbol: "JEPQ", productName: "JPMorgan Nasdaq Equity Premium Income ETF", suitability: "일반", targetPercent: 5 },
  { accountId: "global-shinhan", assetClass: "Gold", symbol: "IAU", productName: "iShares Gold Trust", suitability: "일반", targetPercent: 10 },
  { accountId: "global-shinhan", assetClass: "Bonds", symbol: "IEF", productName: "iShares 7-10Y Treasury bond", suitability: "일반", targetPercent: 7.5 },
  { accountId: "global-shinhan", assetClass: "Bonds", symbol: "TLT", productName: "20+Y", suitability: "일반", targetPercent: 7.5 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VTI", productName: "Vanguard Total Stock Market", suitability: "일반", targetPercent: 5 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VEA", productName: "Vanguard FTSE Developed Markets", suitability: "일반", targetPercent: 10 },
  { accountId: "global-shinhan", assetClass: "Broad Market", symbol: "VWO", productName: "Vanguard FTSE Emerging Markets", suitability: "일반", targetPercent: 5 },
  { accountId: "global-shinhan", assetClass: "Commodities", symbol: "DBC", productName: "Invesco DB Commodity Tracking", suitability: "일반", targetPercent: 5 },
  { accountId: "global-shinhan", assetClass: "Dow Jones Dividend", symbol: "SCHD", productName: "Schwab US Dividend Equity", suitability: "일반", targetPercent: 15 },
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
