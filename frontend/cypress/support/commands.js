// Comando personalizado para iniciar sesión
Cypress.Commands.add('login', (username = 'admin', password = Cypress.env('admin_password') || 'admin123') => {
  cy.visit('/admin/login');
  // Usamos el atributo data-cy en lugar del label (más robusto)
  cy.get('[data-cy="username-input"]').type(username);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  // Esperar a que la página de admin cargue completamente
  cy.url().should('include', '/admin/dashboard');
});
