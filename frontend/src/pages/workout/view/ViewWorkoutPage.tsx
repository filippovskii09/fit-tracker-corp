import { useParams } from 'react-router-dom';

import { DICTIONARY } from '@locales';
import {
  StickyHeader,
  ViewExercisesList,
  WorkoutDetailsSkeleton,
} from '@components';
import { useGetWorkoutById } from '../queries';

const isNotFoundError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  (error as { response?: { status?: number } }).response?.status === 404;

const ViewWorkoutPage = () => {
  const { id } = useParams();
  const infoStyles =
    'w-full h-screen flex items-center justify-center text-center text-xl';

  const { data, error, isLoading, isError } = useGetWorkoutById(id!);

  if (isLoading && !data) {
    return <WorkoutDetailsSkeleton />;
  }

  if (isError && isNotFoundError(error)) {
    return <div className={infoStyles}>{DICTIONARY.workout.view.notFound}</div>;
  }

  if (isError) {
    return <div className={infoStyles}>{DICTIONARY.workout.view.error}</div>;
  }

  if (!data) {
    return <WorkoutDetailsSkeleton />;
  }

  return (
    <main>
      <StickyHeader name={data.name} date={data.date} readOnly />
      <ViewExercisesList exercises={data.exercises} />
    </main>
  );
};

export default ViewWorkoutPage;
