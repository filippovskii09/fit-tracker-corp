import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { JWT_ACCESS_TOKEN_SECRET } from '@src/config/constants';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.getOrThrow.mockReturnValue('test_secret_key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(strategy).toBeDefined();
    expect(configService.getOrThrow).toHaveBeenCalledWith(
      JWT_ACCESS_TOKEN_SECRET,
    );
  });

  describe('validate', () => {
    it('should validate and return user data based on payload', async () => {
      const payload = { sub: 'user-uuid-123', email: 'test@example.com' };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: payload.sub,
        email: payload.email,
      });
    });
  });
});
