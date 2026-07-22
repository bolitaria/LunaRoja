Cypress.Commands.add('login', (username = 'admin', password = 'admin123') => {
  cy.session([username, password], () => {
    cy.visit('/admin/login');
    cy.get('[data-cy="username-input"]', { timeout: 10000 }).type(username);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin/dashboard');
  });
});

Cypress.Commands.add('loginAs', (role) => {
  // Not implemented – skip role-restrictions tests
  throw new Error('loginAs not available in CI');
});

Cypress.Commands.add('loginUI', (username, password) => {
  cy.login(username, password);
});
