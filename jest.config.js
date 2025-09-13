/**
 * Jest Configuration for Sistema Exames
 * Comprehensive testing setup for Clean Architecture
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Custom Jest configuration
const customJestConfig = {
  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Module paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@domains/(.*)$': '<rootDir>/src/domains/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.tsx',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.config.{ts,tsx}',
    '!src/app/globals.css',
    '!src/middleware.ts', // Exclude middleware for now
  ],

  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],

  coverageDirectory: 'coverage',

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Domain-specific thresholds
    'src/domains/**/entities/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/domains/**/value-objects/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/domains/**/use-cases/*.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',

  // Test timeout
  testTimeout: 10000,

  // Verbose output for CI
  verbose: process.env.CI === 'true',

  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Test categories via environment variables
  testNamePattern: process.env.TEST_PATTERN,

  // Mock configuration
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,

  // Error handling
  errorOnDeprecated: true,
  
  // Detect open handles for async cleanup
  detectOpenHandles: true,
  forceExit: false,
};

// Export Jest config
module.exports = createJestConfig(customJestConfig);