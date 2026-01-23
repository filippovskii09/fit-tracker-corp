import { Formik, Form } from 'formik';

import { createWorkoutInitialValues, createWorkoutSchema } from './schemas';
import { useCreateWorkout } from './hooks';
import type { CreateWorkoutFormValues } from '@types';
import {
  FormExercisesList,
  StickyHeader,
  SubmitButtonBlock,
} from '@components';

export const CreateWorkoutPage = () => {
  const handleSubmit = useCreateWorkout();

  return (
    <Formik<CreateWorkoutFormValues>
      initialValues={createWorkoutInitialValues}
      validationSchema={createWorkoutSchema}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, isSubmitting }) => (
        <Form className="min-h-screen bg-main text-white pb-32">
          <StickyHeader
            name={values.name}
            date={values.date}
            handleChange={handleChange}
          />

          <FormExercisesList />

          <SubmitButtonBlock
            isSubmitting={isSubmitting}
            isValid={values.exercises.length > 0}
          />
        </Form>
      )}
    </Formik>
  );
};
