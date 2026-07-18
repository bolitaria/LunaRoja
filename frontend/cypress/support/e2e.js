Cypress.Commands.add('login', (username, password) => {
  cy.visit('/admin/login');
  cy.get('[data-cy="username-input"]', { timeout: 15000 }).should('be.visible').type(username);
  cy.get('input[name="password"]').type(password, { log: false });
  cy.get('button[type="submit"]').click();
  cy.url({ timeout: 20000 }).should('not.include', '/admin/login');
  cy.location('pathname', { timeout: 20000 }).should('eq', '/admin/dashboard');
});