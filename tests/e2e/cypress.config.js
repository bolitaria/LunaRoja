const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://frontend:3000',
    supportFile: false,
    specPattern: 'tests/**/*.cy.js',
  },
});
