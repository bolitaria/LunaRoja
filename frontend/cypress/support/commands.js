Cypress.Commands.add('login', (username = 'admin', password = Cypress.env('admin_password') || 'admin123') => {
  cy.visit('/admin/login');
  cy.get('[data-cy="username-input"]').type(username);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/admin/dashboard');
});
