import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTest.ts'],

  moduleNameMapper: {
    '^@config$': '<rootDir>/src/config',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$':
      '<rootDir>/src/tests/__mocks__/fileMock.ts',
  },

  testMatch: ['<rootDir>/src/**/*.{spec,test}.{ts,tsx}'],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.app.json',
      },
    ],
  },
};

export default config;
