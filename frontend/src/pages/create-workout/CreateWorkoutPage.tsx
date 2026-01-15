import { Formik, Form } from 'formik';

import { ExericesBlock, StickyHeader, SubmitButtonBlock } from './components';
import { createWorkoutInitialValues, createWorkoutSchema } from './schemas';
import type { CreateWorkoutFormValues } from './types';
import { useCreateWorkout } from './hooks';

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

          <ExericesBlock exercises={values.exercises} />

          <SubmitButtonBlock
            isSubmitting={isSubmitting}
            noOneExercises={values.exercises.length === 0}
          />
        </Form>
      )}
    </Formik>
  );
};
