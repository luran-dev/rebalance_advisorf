import type { Instrument } from "./types";

const storageKey = "wb-security-masters";

type StoredSecurityMaster = {
  readonly name: string;
  readonly code: string;
  readonly country: string;
  readonly currency: string;
  readonly category: string;
  readonly price?: number;
  readonly priceUpdatedAt?: string;
  readonly priceSource?: string;
  readonly fxRate?: number;
  readonly fxUpdatedAt?: string;
  readonly fxSource?: string;
};

const toStoredSecurityMaster = (instrument: Instrument): StoredSecurityMaster => ({
  name: instrument.name,
  code: instrument.symbol,
  country: instrument.country,
  currency: instrument.currency,
  category: instrument.category,
  ...(instrument.price === undefined ? {} : { price: instrument.price }),
  ...(instrument.priceUpdatedAt === undefined ? {} : { priceUpdatedAt: instrument.priceUpdatedAt }),
  ...(instrument.priceSource === undefined ? {} : { priceSource: instrument.priceSource }),
  ...(instrument.fxRate === undefined ? {} : { fxRate: instrument.fxRate }),
  ...(instrument.fxUpdatedAt === undefined ? {} : { fxUpdatedAt: instrument.fxUpdatedAt }),
  ...(instrument.fxSource === undefined ? {} : { fxSource: instrument.fxSource }),
});

export const saveSecurityMasters = (instruments: readonly Instrument[]) => {
  window.localStorage.setItem(storageKey, JSON.stringify(instruments.map(toStoredSecurityMaster)));
};
