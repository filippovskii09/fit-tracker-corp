import { useState } from 'react';

import { DICTIONARY } from '@locales';
import { LIBRARY_TAB_DEFINITIONS } from './data';
import type { LibraryTabId } from './types';

export type * from './types';

const INITIAL_TAB_ID: LibraryTabId = 'programs';

const TAB_BASE_CLASSES =
  'flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl border text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-main';

export const LibraryTabs = () => {
  const [selectedId, setSelectedId] = useState<LibraryTabId>(INITIAL_TAB_ID);

  return (
    <div
      role="group"
      aria-label={DICTIONARY.libraryTabs.groupLabel}
      className="flex w-full gap-2 px-4"
    >
      {LIBRARY_TAB_DEFINITIONS.map((tab) => {
        const isSelected = tab.id === selectedId;

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setSelectedId(tab.id)}
            className={`${TAB_BASE_CLASSES} ${
              isSelected
                ? 'border-accent-border bg-accent-soft font-bold text-primary'
                : 'border-border-subtle bg-surface font-semibold text-text-subtle'
            }`}
          >
            {tab.label}
            <span
              className={`font-mono text-xs font-normal ${
                isSelected ? 'text-primary/75' : 'text-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
