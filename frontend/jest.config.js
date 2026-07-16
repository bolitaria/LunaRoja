module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
};
