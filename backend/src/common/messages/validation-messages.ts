export const ValidationMessages = {
  Shared: {
    IsString: 'Must be a string',
    IsNotEmpty: 'Field cannot be empty',
    IsEmail: 'Please provide a valid email address',
  },
  User: {
    FirstNameLength: 'Username must be 50 characters or less',
    PasswordWeak:
      'Password is too weak. It must have at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 symbol.',
  },
} as const;
