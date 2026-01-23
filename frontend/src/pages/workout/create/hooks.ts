import type { AxiosError } from 'axios';
import type { FormikHelpers } from 'formik';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { workoutService } from '@services';
import type { CreateWorkoutFormValues, IExercise, ISet } from '@types';

export const useCreateWorkout = () => {
  const navigate = useNavigate();
  const { create } = DICTIONARY.workout;

  const handleSubmit = async (
    values: CreateWorkoutFormValues,
    { setSubmitting }: FormikHelpers<CreateWorkoutFormValues>,
  ) => {
    try {
      const payload = {
        name: values.name,
        date: new Date(values.date).toISOString(),
        exercises: values.exercises.map((ex: IExercise, index: number) => ({
          exerciseId: ex.exerciseId,
          order: index,
          sets: ex.sets.map((s: ISet, setIndex: number) => ({
            weight: Number(s.weight),
            reps: Number(s.reps),
            order: setIndex,
            isCompleted: false,
          })),
        })),
      };

      await workoutService.create(payload);
      toast.success(create.success);
      navigate(APP_ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const message = (error as AxiosError).response?.data;
      const text = Array.isArray(message)
        ? message[0]
        : message || create.error;
      toast.error(text);
    } finally {
      setSubmitting(false);
    }
  };

  return handleSubmit;
};
