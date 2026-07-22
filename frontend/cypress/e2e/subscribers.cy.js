describe('Suscriptores', () => {
  beforeEach(() => {
    cy.login();
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('muestra la lista de suscriptores', () => {
    cy.visit('/admin/subscribers');
    cy.contains('Suscriptores').should('exist');
    // Si hay algún suscriptor creado por tests anteriores, verifica que la tabla se muestre
    cy.get('table').should('exist');
  });
});

  it('elimina un suscriptor', () => {
    cy.visit('/admin/subscribers');
    cy.get('button[type="submit"]').contains(/eliminar/i).click();
    cy.get('button[type="submit"]').click();
    cy.contains('eliminado').should('exist');
  });
