export interface IUser {
  id: string;
  firstName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSecure extends IUser {
  passwordHash: string;
}
