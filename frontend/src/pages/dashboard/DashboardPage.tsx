import { Calendar } from '@components';
import { useGetWorkouts } from './queries';

export const DashboardPage = () => {
  const { data } = useGetWorkouts();
  return (
    <div className="flex justify-center mt-14">
      <Calendar workouts={data || []} />
    </div>
  );
};
