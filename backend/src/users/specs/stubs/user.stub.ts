import { CreateUserDto } from '@src/users/dto';
import { UserEntity } from '@src/users/entity';

export const createUserDtoStub = (): CreateUserDto => ({
  email: 'test@example.com',
  firstName: 'John Doe',
  password: 'StrongPassword1!',
});

export const userStub = (): UserEntity => ({
  id: 'uuid-v7-generated-id',
  email: createUserDtoStub().email,
  firstName: createUserDtoStub().firstName,
  passwordHash: 'hashed_password_example',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
});
