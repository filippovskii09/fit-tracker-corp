import { Formik, Form } from 'formik';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getErrorMessage } from '@utils';
import { BaseButton, BaseInput } from '@ui';
import { APP_ROUTES } from '@constants';
import { DICTIONARY } from '@locales';
import { useRegister } from '../../queries';
import {
  RegisterInitialValues,
  RegisterSchema,
  type RegisterInitialValuesType,
} from '../../schemas';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { mutate: register, isPending } = useRegister();

  const t = DICTIONARY.auth.register;
  const f = DICTIONARY.auth.fields;

  const handleSubmit = (values: RegisterInitialValuesType) => {
    register(values, {
      onSuccess: () => {
        toast.success(t.success);
        navigate(APP_ROUTES.AUTH.SIGNIN);
      },
      onError: (error) => {
        console.log(error);
        toast.error(getErrorMessage(error));
      },
    });
  };

  return (
    <Formik
      initialValues={RegisterInitialValues}
      validationSchema={RegisterSchema}
      onSubmit={handleSubmit}
    >
      {({ isValid, dirty }) => (
        <Form>
          <BaseInput
            name="firstName"
            label={f.firstName.label}
            placeholder={f.firstName.placeholder}
            InputLabelProps={{ shrink: true }}
          />
          <BaseInput
            name="email"
            label={f.email.label}
            placeholder={f.email.placeholder}
            type="email"
            InputLabelProps={{ shrink: true }}
          />
          <BaseInput
            name="password"
            label={f.password.label}
            placeholder={f.password.placeholder}
            type="password"
            InputLabelProps={{ shrink: true }}
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
