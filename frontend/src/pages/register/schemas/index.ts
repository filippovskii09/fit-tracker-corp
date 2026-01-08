import * as Yup from 'yup';

import { DICTIONARY } from '@locales';

const { validation } = DICTIONARY.common;

export const RegisterSchema = Yup.object().shape({
  firstName: Yup.string().required(validation.required),
  email: Yup.string().email(validation.email).required(validation.required),
  password: Yup.string()
    .min(6, validation.minLength(6))
    .required(validation.required),
});

export const RegisterInitialValues = {
  firstName: '',
  email: '',
  password: '',
};

export type RegisterInitialValuesType = typeof RegisterInitialValues;
