import { DICTIONARY } from '@locales';
import { RoutineFilters } from '@components';

const WorkoutsPlaceholderPage = () => (
  <main className="flex h-full flex-col items-center justify-center gap-6 text-center text-xl text-text-subtle">
    <RoutineFilters />
    <p>{DICTIONARY.workout.placeholder.soon}</p>
  </main>
);

export default WorkoutsPlaceholderPage;
