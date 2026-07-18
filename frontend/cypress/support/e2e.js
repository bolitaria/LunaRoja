Cypress.Commands.add('login', (username, password) => {
  cy.visit('/admin/login');
  cy.get('[data-cy="username-input"]', { timeout: 10000 }).should('be.visible').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/admin/dashboard');
});