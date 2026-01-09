import { createTheme } from '@mui/material';

const PALETTE = {
  neonGreen: '#ccff00',
  darkBg: '#000000',
  cardBg: '#1C1C1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  error: '#FF453A',
};

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: PALETTE.darkBg,
      paper: PALETTE.cardBg,
    },
    primary: {
      main: PALETTE.neonGreen,
      contrastText: '#000000',
    },
    text: {
      primary: PALETTE.textPrimary,
      secondary: PALETTE.textSecondary,
    },
    error: {
      main: PALETTE.error,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1C1C1E',
            borderRadius: '12px',
            '& fieldset': {
              borderColor: '#3A3A3C',
            },
            '&:hover fieldset': {
              borderColor: '#FFFFFF',
            },
            '&.Mui-focused fieldset': {
              borderColor: PALETTE.neonGreen,
            },
          },
          '& .MuiInputLabel-root': {
            color: '#8E8E93',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: PALETTE.neonGreen,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '1rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 15px rgba(204, 255, 0, 0.4)',
          },
        },
        containedPrimary: {
          backgroundColor: PALETTE.neonGreen,
          color: '#000000',
          '&:hover': {
            backgroundColor: '#b3e600',
          },
        },
      },
    },
  },
});
