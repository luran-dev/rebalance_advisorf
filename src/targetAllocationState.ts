import type { Instrument, TargetAllocationDraft, TargetAllocationKey, TargetAsset } from "./types";

export const sumTargetPercent = (
  targets: readonly TargetAsset[],
  accountId: TargetAllocationDraft["accountId"],
): number =>
  targets
    .filter((target) => target.accountId === accountId)
    .reduce((total, target) => total + target.targetPercent, 0);

export const hasTargetAllocation = (
  targets: readonly TargetAsset[],
  key: TargetAllocationKey,
  ignoredKey: TargetAllocationKey | null = null,
): boolean =>
  targets.some(
    (target) =>
      target.accountId === key.accountId &&
      target.symbol === key.symbol &&
      (ignoredKey === null || target.accountId !== ignoredKey.accountId || target.symbol !== ignoredKey.symbol),
  );

export const targetAssetFromDraft = (
  draft: TargetAllocationDraft,
  instrument: Instrument,
): TargetAsset => ({
  accountId: draft.accountId,
  assetClass: instrument.category,
  symbol: instrument.symbol,
  productName: instrument.name,
  suitability: draft.suitability,
  targetPercent: draft.targetPercent,
});

export const addTargetAllocation = (
  targets: readonly TargetAsset[],
  draft: TargetAllocationDraft,
  instrument: Instrument,
): readonly TargetAsset[] => [...targets, targetAssetFromDraft(draft, instrument)];

export const updateTargetAllocation = ({
  targets,
  currentKey,
  draft,
  instrument,
}: {
  readonly targets: readonly TargetAsset[];
  readonly currentKey: TargetAllocationKey;
  readonly draft: TargetAllocationDraft;
  readonly instrument: Instrument;
}): readonly TargetAsset[] =>
  targets.map((target) =>
    target.accountId === currentKey.accountId && target.symbol === currentKey.symbol
      ? targetAssetFromDraft(draft, instrument)
      : target,
  );

export const deleteTargetAllocation = (
  targets: readonly TargetAsset[],
  key: TargetAllocationKey,
): readonly TargetAsset[] =>
  targets.filter((target) => target.accountId !== key.accountId || target.symbol !== key.symbol);
