import type { TextFieldProps } from '@mui/material';
import type { FieldInputProps, FieldMetaProps } from 'formik';

export type BaseInputProps = TextFieldProps & {
  field?: FieldInputProps<unknown>;
  meta?: FieldMetaProps<unknown>;
  helperText?: string;
};
