export const ResponseMessages = {
  User: {
    SuccessRegistration: 'Registration success! Please log in!',
    SuccessAuthorization: 'Successed login!',
    SuccessLogout: 'Logged out successfully!',
    IdNotFound: 'UserId not found!',
  },
  Auth: {
    ExistUser: 'User with this email allready exists!',
    WrongCreds: 'Wrong credentials!',
    RefreshCookieMissing: 'Refresh token not found!',
    RefreshTokenExpired: 'Refresh token expired!',
    RefreshTokenInvalid: 'Invalid refresh token!',
    SessionNotFound: 'Session not found!',
    SessionRevoked: 'Session has been revoked!',
    SessionExpired: 'Session has expired!',
    RefreshReplayed: 'Refresh token already used!',
    RefreshRateLimited:
      'Too many refresh attempts. Please wait before retrying.',
    ServiceUnavailable: 'Authentication service is temporarily unavailable!',
  },
  Workout: {
    NotFound: 'Workout not found',
    IdempotencyKeyReused:
      'This clientRequestId was already used with a different workout payload',
  },
} as const;
