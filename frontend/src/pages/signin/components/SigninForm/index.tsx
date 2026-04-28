import { Formik, Form, Field } from 'formik';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { clearCachedWorkouts, getErrorMessage } from '@utils';
import { BaseButton, BaseInput } from '@ui';
import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { useSignin } from '../../queries';
import {
  SigninInitialValues,
  SigninSchema,
  type SigninInitialValuesType,
} from '../../schemas';

export const SigninForm = () => {
  const navigate = useNavigate();
  const { mutate: signin, isPending } = useSignin();

  const t = DICTIONARY.auth.login;
  const f = DICTIONARY.auth.fields;

  const handleSubmit = (values: SigninInitialValuesType) => {
    signin(values, {
      onSuccess: (data) => {
        clearCachedWorkouts();
        localStorage.setItem('accessToken', data.accessToken);
        toast.success(t.success);
        navigate(APP_ROUTES.DASHBOARD);
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  return (
    <Formik
      initialValues={SigninInitialValues}
      validationSchema={SigninSchema}
      onSubmit={handleSubmit}
    >
      {({ isValid, dirty }) => (
        <Form>
          <Field
            name="email"
            label={f.email.label}
            placeholder={f.email.placeholder}
            type="email"
            InputLabelProps={{ shrink: true }}
            component={BaseInput}
          />
          <Field
            name="password"
            label={f.password.label}
            placeholder={f.password.placeholder}
            type="password"
            InputLabelProps={{ shrink: true }}
            component={BaseInput}
          />

          <BaseButton
            type="submit"
            isLoading={isPending}
            disabled={!isValid || !dirty}
            sx={{ mt: 3 }}
          >
            {t.submitBtn}
          </BaseButton>
        </Form>
      )}
    </Formik>
  );
};
