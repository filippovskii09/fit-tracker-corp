import { Injectable } from '@nestjs/common';

import * as argon2 from 'argon2';

@Injectable()
export class EncryptionService {
  private static readonly ARGON_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    timeCost: 2,
    memoryCost: 4096,
    parallelism: 4,
  };

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, EncryptionService.ARGON_OPTIONS);
  }
}
