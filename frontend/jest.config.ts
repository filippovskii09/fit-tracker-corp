import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTest.ts'],

  moduleNameMapper: {
    '^@config$': '<rootDir>/src/config',
    '^@api(.*)$': '<rootDir>/src/api$1',
    '^@ui(.*)$': '<rootDir>/src/components/ui$1',
    '^@utils(.*)$': '<rootDir>/src/utils$1',
    '^@testUtils(.*)$': '<rootDir>/src/utils/testUtils$1',
    '^@layouts(.*)$': '<rootDir>/src/layouts$1',
    '^@router(.*)$': '<rootDir>/src/router$1',
    '^@modules(.*)$': '<rootDir>/src/modules$1',
    '^@theme(.*)$': '<rootDir>/src/theme$1',
    '^@constants(.*)$': '<rootDir>/src/constants$1',
    '^@locales(.*)$': '<rootDir>/src/locales$1',
    '^@pages(.*)$': '<rootDir>/src/pages$1',
    '^@services(.*)$': '<rootDir>/src/services$1',
    '^@hooks(.*)$': '<rootDir>/src/hooks$1',
    '^@types(.*)$': '<rootDir>/src/types$1',

    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$':
      '<rootDir>/src/tests/__mocks__/fileMock.ts',
  },

  testMatch: ['<rootDir>/src/**/*.{spec,test}.{ts,tsx}'],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',

  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/vite-env.d.ts',
    '!src/**/types.ts',
    '!src/**/*.types.ts',
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/main.tsx',
    '<rootDir>/src/setupTest.ts',
    '/index\\.(ts|tsx)$',
    '<rootDir>/src/assets/',
    '<rootDir>/src/config/',
    '<rootDir>/src/constants/',
    '<rootDir>/src/theme/',
    '<rootDir>/src/locales/',
    '<rootDir>/src/types/',
    '<rootDir>/src/router/index.tsx',
    '<rootDir>/src/layouts/',
    '<rootDir>/src/pages/',
    '<rootDir>/src/utils/navigation.util.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  coverageReporters: ['text', 'json', 'html'],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.app.json',
        isolatedModules: true,
        diagnostics: {
          ignoreCodes: [151001],
        },
      },
    ],
  },
};

export default config;
