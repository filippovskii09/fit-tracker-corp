import { Response } from 'express';

export const mockUsersService = {
  findByEmail: jest.fn(),
  findByEmailForAuth: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
  findByIdForAuth: jest.fn(),
};

export const mockTokenService = {
  verifyRefreshToken: jest.fn(),
  generateAuthTokens: jest.fn(),
};

export const mockEncryptionService = {
  validatePassword: jest.fn(),
  hashPassword: jest.fn(),
};

export const mockAuthService = {
  register: jest.fn(),
  signIn: jest.fn(),
  refreshTokens: jest.fn(),
};

export const mockConfigService = {
  getOrThrow: jest.fn(),
  get: jest.fn(),
};

export const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

export const mockResponse = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as Response;
