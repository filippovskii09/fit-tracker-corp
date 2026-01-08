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
    <Box sx={{ mb: 4, textAlign: 'center' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: 'white', fontWeight: 'bold' }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
          {subtitle}
        </Typography>
      )}

      {linkTo && linkText && (
        <Typography variant="body2" color="text.secondary">
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
