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
      fontSize: '1.125rem',
    },
    body1: {
      color: PALETTE.textSecondary,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.95rem',
    },
  },
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(8, 12, 10, 0.72)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: PALETTE.surface,
          backgroundImage: 'none',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
          borderRadius: '20px',
          padding: '14px 16px 10px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
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
          padding: '10px 20px',
          minWidth: '100px',
        },
        containedPrimary: {
          backgroundColor: PALETTE.acidGreen,
          color: '#0C110F',
          boxShadow: '0 6px 16px rgba(140, 239, 13, 0.18)',
          '&:hover': {
            backgroundColor: '#7BCF0B',
            boxShadow: '0 8px 20px rgba(140, 239, 13, 0.3)',
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
