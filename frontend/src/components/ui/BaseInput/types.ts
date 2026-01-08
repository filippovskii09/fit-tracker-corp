import type { TextFieldProps } from '@mui/material';

export type BaseInputProps = TextFieldProps & {
  name: string;
  label: string;
  helperText?: string;
};
