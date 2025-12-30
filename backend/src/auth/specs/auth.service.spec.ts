import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { UsersService } from '@src/users/users.service';
import {
  createUserDtoStub,
  userStub,
  verifyUserDtoStub,
} from '@src/stubs/user.stub';
import { EncryptionService } from '@src/encryption/encryption.service';
import { ResponseMessages } from '@src/common/messages';
import { AuthService } from '../auth.service';
import { registerResponse } from '../constants';
import { TokenService } from '../token.service';
import { tokensStub } from './stubs';
import {
  mockEncryptionService,
  mockTokenService,
  mockUsersService,
} from './mocks';
import { RefreshTokenDto } from '../dto';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let tokenService: TokenService;
  let encryptionService: EncryptionService;

  const registerDto = createUserDtoStub();
  const signInDto = verifyUserDtoStub();

  const user = userStub();

  const hashedRefreshToken = tokensStub.hashedRefreshToken;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    tokenService = module.get<TokenService>(TokenService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(tokenService).toBeDefined();
    expect(encryptionService).toBeDefined();
  });

  describe('register', () => {
    it('should call findByEmail and return error if user allready exist', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user);

      await expect(authService.register(registerDto)).rejects.toThrow(
        new BadRequestException(ResponseMessages.Auth.ExistUser),
      );

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should call create and return success message', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(user);

      const result = await authService.register(registerDto);

      expect(result).toEqual(registerResponse);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('signin', () => {
    it('should throw BadRequest if user not found', async () => {
      jest.spyOn(usersService, 'findByEmailForAuth').mockResolvedValue(null);

      await expect(authService.signIn(signInDto)).rejects.toThrow(
        new BadRequestException(ResponseMessages.Auth.WrongCreds),
      );
    });

    it('should throw BadRequest if password is wrong', async () => {
      jest.spyOn(usersService, 'findByEmailForAuth').mockResolvedValue(user);
      jest
        .spyOn(encryptionService, 'validatePassword')
        .mockResolvedValue(false);

      await expect(authService.signIn(signInDto)).rejects.toThrow(
        new BadRequestException(ResponseMessages.Auth.WrongCreds),
      );
    });

    it('should return tokens and save refresh token hash if creds are valid', async () => {
      jest.spyOn(usersService, 'findByEmailForAuth').mockResolvedValue(user);
      jest.spyOn(encryptionService, 'validatePassword').mockResolvedValue(true);
      jest
        .spyOn(encryptionService, 'hashPassword')
        .mockResolvedValue(hashedRefreshToken);
      jest
        .spyOn(tokenService, 'generateAuthTokens')
        .mockResolvedValue(tokensStub);

      const result = await authService.signIn(signInDto);

      expect(result).toEqual({
        accessToken: tokensStub.accessToken,
        refreshToken: tokensStub.refreshToken,
        message: ResponseMessages.User.SuccessAuthorization,
      });

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        user.id,
        hashedRefreshToken,
      );
    });
  });

  describe('refreshTokens', () => {
    const refreshDto: RefreshTokenDto = {
      refreshToken: 'refresh_token_example',
    };

    it('should throw Forbidden if refresh token is invalid', async () => {
      jest
        .spyOn(tokenService, 'verifyRefreshToken')
        .mockRejectedValue(new ForbiddenException());

      await expect(authService.refreshTokens(refreshDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if token hash does not match', async () => {
      jest.spyOn(tokenService, 'verifyRefreshToken').mockResolvedValue(user.id);
      jest.spyOn(usersService, 'findByIdForAuth').mockResolvedValue({
        ...user,
        hashedRefreshToken,
      });
      jest
        .spyOn(encryptionService, 'validatePassword')
        .mockResolvedValue(false);

      await expect(authService.refreshTokens(refreshDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return new tokens and update refresh token hash', async () => {
      jest.spyOn(tokenService, 'verifyRefreshToken').mockResolvedValue(user.id);
      jest.spyOn(usersService, 'findByIdForAuth').mockResolvedValue({
        ...user,
        hashedRefreshToken,
      });
      jest.spyOn(encryptionService, 'validatePassword').mockResolvedValue(true);
      jest
        .spyOn(tokenService, 'generateAuthTokens')
        .mockResolvedValue(tokensStub);
      jest
        .spyOn(encryptionService, 'hashPassword')
        .mockResolvedValue(hashedRefreshToken);

      const result = await authService.refreshTokens(refreshDto);

      expect(result).toEqual(tokensStub);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        user.id,
        hashedRefreshToken,
      );
    });

    it('should throw Forbidden if user not found or has no refresh token in DB', async () => {
      jest.spyOn(tokenService, 'verifyRefreshToken').mockResolvedValue(user.id);
      jest.spyOn(usersService, 'findByIdForAuth').mockResolvedValue(null);

      await expect(authService.refreshTokens(refreshDto)).rejects.toThrow(
        ForbiddenException,
      );

      jest.spyOn(usersService, 'findByIdForAuth').mockResolvedValue({
        ...user,
        hashedRefreshToken: null,
      });

      await expect(authService.refreshTokens(refreshDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
