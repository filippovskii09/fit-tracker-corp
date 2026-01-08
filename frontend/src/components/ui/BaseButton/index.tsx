import { Button, CircularProgress } from '@mui/material';

import type { AppButtonProps } from './types';

export const BaseButton = ({
  isLoading,
  children,
  disabled,
  ...props
}: AppButtonProps) => {
  return (
    <Button
      {...props}
      fullWidth
      variant="contained"
      disabled={disabled || isLoading}
      sx={{
        mt: 2,
        height: '56px',
      }}
    >
      {isLoading ? <CircularProgress size={24} color="inherit" /> : children}
    </Button>
  );
};
