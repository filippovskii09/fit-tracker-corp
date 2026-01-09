export const authLocale = {
  register: {
    title: 'Create Account',
    success: 'Account created! Please log in.',
    submitBtn: 'Sign Up',
    haveAccount: 'Already have an account?',
    loginLink: 'Log in here',
  },
  login: {
    title: 'Sign in',
    submitBtn: 'Sign In',
    noAccount: "Don't have an account?",
    registerLink: 'Sign up here',
    success: 'Welcome back!',
  },
  fields: {
    firstName: {
      label: 'First Name',
      placeholder: 'John',
    },
    email: {
      label: 'Email Address',
      placeholder: 'john@example.com',
    },
    password: {
      label: 'Password',
      placeholder: '••••••••',
    },
  },
} as const;
