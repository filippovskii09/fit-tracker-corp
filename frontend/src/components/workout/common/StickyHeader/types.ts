import type { ChangeEvent, ReactNode } from 'react';

export interface IStickyHeaderProps {
  name: string;
  date: string;
  handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  nameError?: string;
  actions?: ReactNode;
}
