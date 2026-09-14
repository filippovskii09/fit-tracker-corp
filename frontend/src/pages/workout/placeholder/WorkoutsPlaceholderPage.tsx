import { DICTIONARY } from '@locales';
import { LibraryTabs, RoutineFilters } from '@components';

const WorkoutsPlaceholderPage = () => (
  <main className="flex h-full flex-col items-center justify-center gap-6 text-center text-xl text-text-subtle">
    <LibraryTabs />
    <RoutineFilters />
    <p>{DICTIONARY.workout.placeholder.soon}</p>
  </main>
);

export default WorkoutsPlaceholderPage;
