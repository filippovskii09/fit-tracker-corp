import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import type { AuthPageHeaderProps } from './types';

export const AuthPageHeader = ({
  title,
  subtitle,
  linkText,
  linkTo,
  linkActionText,
}: AuthPageHeaderProps) => {
  return (
    <Box sx={{ mb: { xs: 4.5, sm: 4 }, textAlign: 'center' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: { xs: '2rem', sm: '2.125rem' },
          lineHeight: 1.12,
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
          {subtitle}
        </Typography>
      )}

      {linkTo && linkText && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {linkText}{' '}
          <Link
            component={RouterLink}
            to={linkTo}
            underline="hover"
            sx={{ color: 'primary.main', fontWeight: 600 }}
          >
            {linkActionText}
          </Link>
        </Typography>
      )}
    </Box>
  );
};
