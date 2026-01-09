import { TextField } from '@mui/material';

import type { BaseInputProps } from './types';

export const BaseInput = ({
  field,
  meta,
  helperText,
  ...props
}: BaseInputProps) => {
  const hasError = meta ? meta.touched && Boolean(meta.error) : false;

  return (
    <TextField
      {...field}
      {...props}
      fullWidth
      variant="outlined"
      margin="normal"
      error={hasError}
      helperText={hasError ? meta?.error : helperText}
      sx={{ mb: 2 }}
    />
  );
};
