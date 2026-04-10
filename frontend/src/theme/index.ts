import { createTheme } from '@mui/material';

import { PALETTE } from './constants';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: PALETTE.darkBg,
      paper: PALETTE.surface,
    },
    primary: {
      main: PALETTE.acidGreen,
      contrastText: PALETTE.darkBg,
    },
    text: {
      primary: PALETTE.textPrimary,
      secondary: PALETTE.textSecondary,
    },
    divider: PALETTE.borderSubtle,
    action: {
      disabled: PALETTE.disabled,
      disabledBackground: PALETTE.borderSubtle,
      focus: PALETTE.accentSoft,
      hover: PALETTE.accentSoft,
      selected: PALETTE.accentSoft,
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    body1: {
      color: PALETTE.textSecondary,
      fontSize: '1rem',
      lineHeight: 1.55,
    },
    body2: {
      fontSize: '0.9375rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '1rem',
    },
  },
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: PALETTE.backdrop,
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: PALETTE.surface,
          backgroundImage: 'none',
          boxShadow: PALETTE.dialogShadow,
          borderRadius: '20px',
          padding: '14px 16px 10px',
          border: `1px solid ${PALETTE.dialogBorder}`,
          margin: '16px',
          width: 'calc(100% - 32px)',
          maxWidth: 420,
          [theme.breakpoints.up('sm')]: {
            margin: '24px',
            width: 'auto',
          },
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '6px 4px 2px',
          textAlign: 'center',
          fontWeight: 600,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '6px 4px 10px',
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          color: PALETTE.textSecondary,
          textAlign: 'center',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: '8px 4px 6px',
          display: 'grid',
          gap: '10px',
          gridTemplateColumns: '1fr',
          [theme.breakpoints.up('sm')]: {
            gridTemplateColumns: '1fr 1fr',
          },
          '& .MuiButton-root': {
            minHeight: 44,
            width: '100%',
            marginLeft: 0,
          },
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          padding: '12px 22px',
          minWidth: '100px',
          minHeight: '48px',
          '&.Mui-focusVisible': {
            outline: `2px solid ${PALETTE.focusRing}`,
            outlineOffset: '2px',
          },
        },
        containedPrimary: {
          backgroundColor: PALETTE.acidGreen,
          color: PALETTE.darkBg,
          boxShadow: PALETTE.primarySoftShadow,
          '&:hover': {
            backgroundColor: PALETTE.acidGreenHover,
            boxShadow: PALETTE.primaryHoverShadow,
          },
        },
        textPrimary: {
          color: PALETTE.textSecondary,
          '&:hover': {
            color: PALETTE.textPrimary,
            backgroundColor: PALETTE.textHoverSurface,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '56px',
            borderRadius: '16px',
            fontSize: '1rem',
          },
          '& .MuiInputBase-input': {
            paddingTop: '16px',
            paddingBottom: '16px',
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.9375rem',
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.875rem',
          },
        },
      },
    },
  },
});
