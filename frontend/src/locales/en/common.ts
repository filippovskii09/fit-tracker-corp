export const commonLocale = {
  validation: {
    required: 'This field is required!',
    email: 'Invalid email address',
    minLength: (min: number) => `Must be at least ${min} characters`,
  },
  errors: {
    unknown: 'An unknown error occurred',
  },
} as const;
