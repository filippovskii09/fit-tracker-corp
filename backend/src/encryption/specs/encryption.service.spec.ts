import { Test, TestingModule } from '@nestjs/testing';

import { EncryptionService } from '../encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password', async () => {
    const password = '3edc$RFV';
    const hashedPass = await service.hashPassword(password);
    expect(hashedPass).toBeDefined();
    expect(hashedPass).not.toEqual(password);
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      const password = 'mySuperPassword123';
      const hash = await service.hashPassword(password);

      const isValid = await service.validatePassword(hash, password);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const password = 'mySuperPassword123';
      const hash = await service.hashPassword(password);

      const isValid = await service.validatePassword(hash, 'wrongPassword');

      expect(isValid).toBe(false);
    });
  });
});
