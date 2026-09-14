import { DICTIONARY } from '@locales';
import type { ILibraryTabDefinition } from './types';

const { programs, exercises } = DICTIONARY.libraryTabs;

// Temporary static counts per the library-tabs-ui task constraints — no
// section data model or API call, see design.md.
export const LIBRARY_TAB_DEFINITIONS: readonly ILibraryTabDefinition[] = [
  { id: 'programs', label: programs, count: 12 },
  { id: 'exercises', label: exercises, count: 240 },
];
