export const ResponseMessages = {
  User: {
    SuccessRegistration: 'Registration success! Please log in!',
    SuccessAuthorization: 'Successed login!',
    IdNotFound: 'UserId not found!',
  },
  Auth: {
    ExistUser: 'User with this email allready exists!',
    WrongCreds: 'Wrong credentials!',
  },
  Workout: {
    NotFound: 'Workout not found',
  },
} as const;
