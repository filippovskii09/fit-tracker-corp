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
        padding: 2,
      }}
    >
      <Container maxWidth="xs">
        <Outlet />
      </Container>
    </Box>
  );
};
