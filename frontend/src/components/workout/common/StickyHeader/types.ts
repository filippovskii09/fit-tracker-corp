import type { ChangeEvent, ReactNode, RefObject } from 'react';

export interface IStickyHeaderProps {
  name: string;
  date: string;
  handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  nameError?: string;
  actions?: ReactNode;
  /** Lets a parent move focus to the name field (e.g. after Restore/Discard). */
  nameInputRef?: RefObject<HTMLInputElement | null>;
}
