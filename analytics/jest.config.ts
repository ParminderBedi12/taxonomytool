import type { Config } from '@jest/types';

/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
export default async (): Promise<Config.InitialOptions> => {
  return {
    // Automatically clear mock calls, instances and results before every test
    clearMocks: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // Indicates which provider should be used to instrument code for coverage
    coverageProvider: 'v8',

    // The test environment that will be used for testing
    testEnvironment: 'jsdom',

    // A map from regular expressions to paths to transformer
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },

    // A list of paths to modules that run some code to configure or set up the testing framework before each test
    setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],

    // Indicates whether each individual test should be reported during the run
    verbose: true,
  };
};
