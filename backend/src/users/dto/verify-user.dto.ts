import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsStrongPassword,
} from 'class-validator';

import { ValidationMessages } from '@src/common/messages';

export class VerifyUserDto {
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
