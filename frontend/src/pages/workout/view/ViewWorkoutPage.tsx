import { useParams } from 'react-router-dom';

import { DICTIONARY } from '@locales';
import { StickyHeader, ViewExercisesList } from '@components';
import { useGetWorkoutById } from '../queries';

const ViewWorkoutPage = () => {
  const { id } = useParams();
  const infoStyles =
    'w-full h-screen flex items-center justify-center text-center text-xl';

  const { data } = useGetWorkoutById(id!);
  if (!data) {
    return <div className={infoStyles}>{DICTIONARY.workout.view.notFound}</div>;
  }

  return (
    <>
      <StickyHeader name={data?.name} date={data?.date} readOnly />
      <ViewExercisesList exercises={data?.exercises} />
    </>
  );
};

export default ViewWorkoutPage;
