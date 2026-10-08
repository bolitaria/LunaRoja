/**
 * Login robusto: espera a que el backend responda al POST /api/auth/login
 * antes de comprobar la redirección. Evita flakiness cuando el proxy tarda.
 */
Cypress.Commands.add('login', (username = 'admin', password = 'admin123') => {
  cy.session([username, password], () => {
    cy.visit('/admin/login');

    // Esperar a que el formulario esté montado
    cy.get('[data-cy="username-input"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(username);

    cy.get('input[type="password"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(password);

    // Intercept ANTES del click para capturar la respuesta
    cy.intercept('POST', '**/api/auth/login').as('loginRequest');

    cy.get('button[type="submit"]').should('be.enabled').click();

    // Esperar a la respuesta del backend (200 OK)
    cy.wait('@loginRequest', { timeout: 15000 })
      .its('response.statusCode')
      .should('eq', 200);

    // Ahora sí: comprobar redirección
    cy.url({ timeout: 15000 }).should('include', '/admin/dashboard');
  });
});

Cypress.Commands.add('loginAs', (role) => {
  // No implementado: usado solo por role-restrictions (spec skipped)
  throw new Error('loginAs not available in CI');
});

Cypress.Commands.add('loginUI', (username, password) => {
  cy.login(username, password);
});
