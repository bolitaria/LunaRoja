const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  coverageProvider: 'v8',   // ← esto soluciona el error con --coverage
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/context/(.*)$': '<rootDir>/src/context/$1',
  },
};

module.exports = createJestConfig(customJestConfig);