export const ResponseMessages = {
  User: {
    SuccessRegistration: 'Registration success! Please log in!',
    SuccessAuthorization: 'Successed login!',
  },
  Auth: {
    ExistUser: 'User with this email allready exists!',
    WrongCreds: 'Wrong credentials!',
  },
} as const;
