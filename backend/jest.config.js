module.exports = {
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@?nanoid|other-esm-lib)/)'
  ],
};