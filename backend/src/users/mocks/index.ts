export const mockUserRepository = {
  save: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
};

export const mockEncryptionService = {
  hashPassword: jest.fn(),
};
