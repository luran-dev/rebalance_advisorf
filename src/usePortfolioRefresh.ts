import { useState, type Dispatch, type SetStateAction } from "react";
import { DEFAULT_EXCHANGE_RATES } from "./calculations";
import { updateAccountsDefaultFx, type PortfolioState } from "./accountState";
import { fetchFxQuote } from "./fxApi";
import { isFxCacheFresh, loadStoredFxRates, saveStoredFxRates, type StoredFxRates } from "./fxStorage";
import { updateHoldingPrice } from "./holdingState";
import { updateInstrumentFx, updateInstrumentPrice } from "./instrumentState";
import { fetchMarketQuote } from "./marketApi";
import { saveSecurityMasters } from "./securityMastersStorage";
import type { Currency, ExchangeRates, FxQuote } from "./types";

type RefreshStatus = {
  readonly isRunning: boolean;
  readonly message: string;
};

type RefreshOptions = {
  readonly portfolio: PortfolioState;
  readonly setPortfolio: Dispatch<SetStateAction<PortfolioState>>;
};

const storedRatesToExchangeRates = (rates: StoredFxRates): ExchangeRates => ({
  KRW: 1,
  USD: rates.USD?.rate ?? DEFAULT_EXCHANGE_RATES.USD,
});

const fxQuoteToStored = (quote: FxQuote) => ({
  ...quote,
  updatedAt: new Date().toISOString(),
});

const nonKrwCurrencies = (portfolio: PortfolioState): readonly Currency[] =>
  Array.from(
    new Set(
      [
        ...portfolio.instruments.map((instrument) => instrument.currency),
        ...portfolio.holdings.map((holding) => holding.currency),
        ...portfolio.cashPositions.map((cash) => cash.currency),
      ].filter((currency) => currency !== "KRW"),
    ),
  );

export function usePortfolioRefresh({ portfolio, setPortfolio }: RefreshOptions) {
  const [priceRefresh, setPriceRefresh] = useState<RefreshStatus>({ isRunning: false, message: "현재가 갱신 전" });
  const [fxRefresh, setFxRefresh] = useState<RefreshStatus>({ isRunning: false, message: "환율 갱신 전" });
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(() => storedRatesToExchangeRates(loadStoredFxRates()));

  const refreshVisibleHoldingPrices = async () => {
    if (priceRefresh.isRunning) {
      return;
    }
    const symbols = Array.from(new Set(portfolio.instruments.map((instrument) => instrument.symbol).filter((symbol) => symbol.length > 0)));
    if (symbols.length === 0) {
      setPriceRefresh({ isRunning: false, message: "갱신할 종목코드가 없습니다." });
      return;
    }

    setPriceRefresh({ isRunning: true, message: `현재가 갱신 중 0/${symbols.length}` });
    let updated = 0;
    let failed = 0;
    let updatedInstruments = portfolio.instruments;

    for (const [index, symbol] of symbols.entries()) {
      setPriceRefresh({ isRunning: true, message: `현재가 갱신 중 ${index + 1}/${symbols.length}` });
      try {
        const quote = await fetchMarketQuote(symbol);
        updatedInstruments = updateInstrumentPrice(updatedInstruments, quote);
        setPortfolio((current) => ({
          ...current,
          instruments: updateInstrumentPrice(current.instruments, quote),
          holdings: updateHoldingPrice(current.holdings, quote),
        }));
        updated += 1;
      } catch {
        failed += 1;
      }
    }

    saveSecurityMasters(updatedInstruments);
    setPriceRefresh({
      isRunning: false,
      message: failed === 0 ? `${updated}개 종목 현재가 갱신 완료` : `${updated}개 성공, ${failed}개 실패`,
    });
  };

  const refreshExchangeRates = async () => {
    if (fxRefresh.isRunning) {
      return;
    }
    const cachedRates = loadStoredFxRates();
    if (isFxCacheFresh() && cachedRates.USD !== undefined) {
      setExchangeRates(storedRatesToExchangeRates(cachedRates));
      setFxRefresh({ isRunning: false, message: `캐시 환율 사용: USD ${cachedRates.USD.rate.toFixed(2)}원` });
      return;
    }

    const currencies = nonKrwCurrencies(portfolio);
    if (currencies.length === 0) {
      setFxRefresh({ isRunning: false, message: "갱신할 외화가 없습니다." });
      return;
    }

    setFxRefresh({ isRunning: true, message: `환율 갱신 중 0/${currencies.length}` });
    const rates: StoredFxRates = { ...cachedRates };
    let updated = 0;
    let failed = 0;
    let updatedInstruments = portfolio.instruments;
    let updatedAccounts = portfolio.accounts;

    for (const [index, currency] of currencies.entries()) {
      setFxRefresh({ isRunning: true, message: `환율 갱신 중 ${index + 1}/${currencies.length}` });
      try {
        const quote = await fetchFxQuote(currency);
        rates[currency] = fxQuoteToStored(quote);
        updatedInstruments = updateInstrumentFx(updatedInstruments, quote);
        updatedAccounts = updateAccountsDefaultFx(updatedAccounts, quote.currency, quote.rate);
        setExchangeRates(storedRatesToExchangeRates(rates));
        setPortfolio((current) => ({
          ...current,
          accounts: updateAccountsDefaultFx(current.accounts, quote.currency, quote.rate),
          instruments: updateInstrumentFx(current.instruments, quote),
        }));
        updated += 1;
      } catch {
        failed += 1;
      }
    }

    saveStoredFxRates(rates);
    saveSecurityMasters(updatedInstruments);
    setPortfolio((current) => ({ ...current, accounts: updatedAccounts, instruments: updatedInstruments }));
    setFxRefresh({
      isRunning: false,
      message: failed === 0 ? `${updated}개 환율 갱신 완료` : `${updated}개 성공, ${failed}개 실패`,
    });
  };

  return { exchangeRates, priceRefresh, fxRefresh, refreshVisibleHoldingPrices, refreshExchangeRates };
}
