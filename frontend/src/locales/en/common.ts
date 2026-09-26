export const commonLocale = {
  validation: {
    required: 'This field is required!',
    email: 'Invalid email address',
    minLength: (min: number) => `Must be at least ${min} characters`,
  },
  errors: {
    unknown: 'An unknown error occurred',
  },
  session: {
    retryTitle: "We couldn't reach the server",
    retryMessage:
      'Your session is still safe. Check your connection and try again.',
    retryButton: 'Try again',
    retryAvailableIn: (seconds: number) => `Retry available in ${seconds}s`,
  },
} as const;
