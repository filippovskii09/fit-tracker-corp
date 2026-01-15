import { createTheme } from '@mui/material';

const PALETTE = {
  acidGreen: '#8CEF0D',
  darkBg: '#0C110F',
  surface: '#181D1B',
  textPrimary: '#FFFFFF',
  textSecondary: '#9C9D9F',
  error: '#FF453A',
};

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: PALETTE.darkBg,
      paper: PALETTE.surface,
    },
    primary: {
      main: PALETTE.acidGreen,
      contrastText: '#0C110F',
    },
    text: {
      primary: PALETTE.textPrimary,
      secondary: PALETTE.textSecondary,
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body1: {
      color: PALETTE.textSecondary,
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#181D1B',
          backgroundImage: 'none',
          boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.4)',
          padding: '8px 18px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          margin: '12px',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '8px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '8px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          justifyContent: 'center',
          gap: '12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          padding: '10px 24px',
          minWidth: '100px',
        },
        containedPrimary: {
          backgroundColor: PALETTE.acidGreen,
          color: '#0C110F',
          boxShadow: '0 4px 12px rgba(140, 239, 13, 0.2)',
          '&:hover': {
            backgroundColor: '#7BCF0B',
            boxShadow: '0 6px 16px rgba(140, 239, 13, 0.4)',
          },
        },
        textPrimary: {
          color: PALETTE.textSecondary,
          '&:hover': {
            color: '#FFFFFF',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
  },
});
