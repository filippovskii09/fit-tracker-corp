import * as Yup from 'yup';

export const createWorkoutInitialValues = (date?: string) => ({
  name: '',
  date: date ?? new Date().toISOString().split('T')[0],
  exercises: [],
});

export const createWorkoutSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
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
                .typeError('Must be a number'),
              reps: Yup.number()
                .min(1, 'At least 1 rep')
                .required('Required')
                .typeError('Must be a number'),
            }),
          )
          .min(1, 'Add at least one set'),
      }),
    )
    .min(1, 'Add at least one exercise'),
});
