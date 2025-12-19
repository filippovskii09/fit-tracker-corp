import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

import { ValidationMessages } from '@src/common/messages';

export class CreateUserDto {
  @IsString({ message: ValidationMessages.Shared.IsString })
  @IsNotEmpty({ message: ValidationMessages.Shared.IsNotEmpty })
  @MaxLength(50, { message: ValidationMessages.User.FirstNameLength })
  firstName!: string;

  @IsString({ message: ValidationMessages.Shared.IsString })
  @IsNotEmpty({ message: ValidationMessages.Shared.IsNotEmpty })
  @IsEmail({}, { message: ValidationMessages.Shared.IsEmail })
  email!: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { message: ValidationMessages.User.PasswordWeak },
  )
  @IsNotEmpty({ message: ValidationMessages.Shared.IsNotEmpty })
  password!: string;
}
