import { tokens } from '@tokens';

export const PALETTE = {
  acidGreen: tokens.color.primary,
  acidGreenHover: tokens.color['primary-hover'],
  darkBg: tokens.color.main,
  surface: tokens.color.surface,
  textPrimary: tokens.color['text-primary'],
  textSecondary: tokens.color.muted,
  accentSoft: tokens.color['accent-soft'],
  borderSubtle: tokens.color['border-subtle'],
  focusRing: tokens.color['focus-ring'],
  disabled: tokens.color.disabled,
  backdrop: tokens.app.backdrop,
  dialogBorder: tokens.app['dialog-border'],
  textHoverSurface: tokens.app['text-hover-surface'],
  dialogShadow: tokens.shadow.dialog,
  primarySoftShadow: tokens.shadow['primary-soft'],
  primaryHoverShadow: tokens.shadow['primary-hover'],
} as const;
