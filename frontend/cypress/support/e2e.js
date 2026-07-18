import 'cypress-file-upload';
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/admin/login');
  cy.get('[data-cy="username-input"]', { timeout: 15000 }).should('be.visible').type(username);
  cy.get('input[name="password"]').type(password, { log: false });
  cy.get('button[type="submit"]').click();

  // En lugar de esperar que la URL no contenga login, esperamos específicamente el dashboard
  cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');
  // O si redirige a otra página después del login, ajústalo.
});