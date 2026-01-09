import type { ButtonProps } from '@mui/material';
import type { ReactNode } from 'react';

export type AppButtonProps = ButtonProps & {
  isLoading?: boolean;
  children: ReactNode;
  disabled?: boolean;
};
