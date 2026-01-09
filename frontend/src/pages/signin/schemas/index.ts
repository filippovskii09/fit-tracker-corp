import * as Yup from 'yup';

import { DICTIONARY } from '@locales';

const { validation } = DICTIONARY.common;

export const SigninSchema = Yup.object().shape({
  email: Yup.string().email(validation.email).required(validation.required),
  password: Yup.string().required(validation.required),
});

export const SigninInitialValues = {
  email: '',
  password: '',
};

export type SigninInitialValuesType = typeof SigninInitialValues;
