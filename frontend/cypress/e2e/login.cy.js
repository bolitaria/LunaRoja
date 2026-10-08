/// <reference types="cypress" />

describe('Login de administrador', () => {
  beforeEach(() => {
    cy.visit('/admin/login');
  });

  it('muestra el formulario de login', () => {
    cy.get('[data-cy="username-input"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').invoke('text').should('match', /iniciar sesión/i);
  });

  it('rechaza credenciales incorrectas', () => {
    cy.intercept('POST', '**/api/auth/login').as('loginFail');

    cy.get('[data-cy="username-input"]').type('admin');
    cy.get('input[type="password"]').type('wrong-password-xyz');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginFail', { timeout: 15000 })
      .its('response.statusCode')
      .should('be.oneOf', [401, 403, 400]);

    // Debe seguir en la página de login
    cy.url().should('include', '/admin/login');
  });

  it('acepta credenciales correctas y redirige al dashboard', () => {
    const username = Cypress.env('admin_username') || 'admin';
    const password = Cypress.env('admin_password') || 'admin123';

    cy.intercept('POST', '**/api/auth/login').as('loginOk');

    cy.get('[data-cy="username-input"]').type(username);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();

    cy.wait('@loginOk', { timeout: 15000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.url({ timeout: 15000 }).should('include', '/admin/dashboard');
  });
});
