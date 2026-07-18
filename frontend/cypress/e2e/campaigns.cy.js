describe('Campañas', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('permite crear una campaña nueva', () => {
    cy.visit('/admin/campaigns/new');
    cy.get('input[name="name"]').type('Campaña E2E');
    cy.get('textarea[name="description"]').type('Descripción');
    cy.get('button[type="submit"]').click();
    cy.contains('Campaña creada correctamente').should('exist');
  });
});
  it('edita una campaña existente', () => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.visit('/admin/campaigns');
    cy.get('a').contains('Editar').click();
    cy.get('input[name="name"]').clear().type('Campaña E2E Editada');
    cy.get('button[type="submit"]').click();
    cy.contains('Campaña actualizada').should('exist');
  });

  it('elimina una campaña', () => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.visit('/admin/campaigns');
    cy.get('button').contains('Eliminar').click();
    cy.get('button[type="submit"]').click(); // confirmación
    cy.contains('eliminada').should('exist');
  });
