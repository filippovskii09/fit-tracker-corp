import { TextField } from '@mui/material';
import { useField } from 'formik';

import type { BaseInputProps } from './types';

export const BaseInput = ({ name, helperText, ...props }: BaseInputProps) => {
  const [field, meta] = useField(name);
  const hasError = meta.touched && Boolean(meta.error);

  return (
    <TextField
      {...field}
      {...props}
      fullWidth
      variant="outlined"
      margin="normal"
      error={hasError}
      helperText={hasError ? meta.error : helperText}
      sx={{ mb: 2 }}
    />
  );
};
