import { Formik, Form } from 'formik';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { createWorkoutInitialValues, createWorkoutSchema } from './schemas';
import { useCreateWorkout } from './hooks';
import type { CreateWorkoutFormValues } from '@types';
import {
  FormExercisesList,
  StickyHeader,
  SubmitButtonBlock,
} from '@components';
import { APP_ROUTES } from '@constants';

const CreateWorkoutPage = () => {
  const handleSubmit = useCreateWorkout();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');

  if (!date) {
    navigate(APP_ROUTES.DASHBOARD);
    return;
  }

  const initialValues = createWorkoutInitialValues(date);
  return (
    <main>
      <Formik<CreateWorkoutFormValues>
        initialValues={initialValues}
        validationSchema={createWorkoutSchema}
        onSubmit={handleSubmit}
        validateOnMount
      >
        {({
          values,
          handleChange,
          isSubmitting,
          isValid,
          errors,
          submitCount,
        }) => (
          <Form className="min-h-screen bg-main text-white pb-32">
            <StickyHeader
              name={values.name}
              date={date}
              handleChange={handleChange}
              nameError={submitCount > 0 ? errors.name : undefined}
            />

            <FormExercisesList />

            <SubmitButtonBlock
              isSubmitting={isSubmitting}
              isValid={isValid && values.exercises.length > 0}
            />
          </Form>
        )}
      </Formik>
    </main>
  );
};

export default CreateWorkoutPage;
