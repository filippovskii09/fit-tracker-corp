import { IsString, IsNotEmpty } from 'class-validator';

import { ValidationMessages } from '@src/common/messages';

export class RefreshTokenDto {
  @IsString({ message: ValidationMessages.Shared.IsString })
  @IsNotEmpty({ message: ValidationMessages.Shared.IsNotEmpty })
  refreshToken!: string;
}
