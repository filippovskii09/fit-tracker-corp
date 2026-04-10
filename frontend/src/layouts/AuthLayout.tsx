import { Box, Container, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        padding: { xs: 3, sm: 2 },
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Outlet />
      </Container>
    </Box>
  );
};
