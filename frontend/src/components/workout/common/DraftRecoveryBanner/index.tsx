import { DICTIONARY } from '@locales';

interface DraftRecoveryBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
}

// Accessible Restore/Discard prompt for a recovered workout draft
// (design.md D6, task 7.3). A labelled `region` landmark makes it
// discoverable to assistive tech without the interruption/conflict of
// stacking `role="alert"` (implicitly assertive) with `aria-live="polite"`
// on the same interactive container.
export const DraftRecoveryBanner = ({
  onRestore,
  onDiscard,
}: DraftRecoveryBannerProps) => {
  const { draft } = DICTIONARY.workout.create;

  return (
    <div
      role="region"
      aria-label={draft.recoveredMessage}
      className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-surface px-4 py-4 text-sm text-white sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{draft.recoveredMessage}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="rounded-xl bg-primary px-4 py-2 font-semibold text-surface"
        >
          {draft.restore}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-xl border border-white/20 px-4 py-2 font-semibold text-white"
        >
          {draft.discard}
        </button>
      </div>
    </div>
  );
};
