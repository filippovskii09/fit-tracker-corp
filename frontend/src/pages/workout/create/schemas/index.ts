import * as Yup from 'yup';

import {
  WORKOUT_MAX_EXERCISES,
  WORKOUT_MAX_SETS_PER_EXERCISE,
  WORKOUT_NAME_MAX_LENGTH,
  WORKOUT_SET_VALUE_MAX,
} from '@constants';

export const createWorkoutInitialValues = (date?: string) => ({
  name: '',
  date: date ?? new Date().toISOString().split('T')[0],
  exercises: [],
});

export const createWorkoutSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .max(
      WORKOUT_NAME_MAX_LENGTH,
      `Must be at most ${WORKOUT_NAME_MAX_LENGTH} characters`,
    ),
  date: Yup.string().required(),
  exercises: Yup.array()
    .of(
      Yup.object().shape({
        exerciseId: Yup.string().required(),
        name: Yup.string().required(),
        muscleGroup: Yup.string().required(),
        sets: Yup.array()
          .of(
            Yup.object().shape({
              weight: Yup.number()
                .min(0, 'Must be positive')
                .max(
                  WORKOUT_SET_VALUE_MAX,
                  `Must be at most ${WORKOUT_SET_VALUE_MAX}`,
                )
                .typeError('Must be a number'),
              reps: Yup.number()
                .min(1, 'At least 1 rep')
                .max(
                  WORKOUT_SET_VALUE_MAX,
                  `Must be at most ${WORKOUT_SET_VALUE_MAX}`,
                )
                .required('Required')
                .typeError('Must be a number'),
            }),
          )
          .min(1, 'Add at least one set')
          .max(
            WORKOUT_MAX_SETS_PER_EXERCISE,
            `Add at most ${WORKOUT_MAX_SETS_PER_EXERCISE} sets`,
          ),
      }),
    )
    .min(1, 'Add at least one exercise')
    .max(
      WORKOUT_MAX_EXERCISES,
      `Add at most ${WORKOUT_MAX_EXERCISES} exercises`,
    ),
});
