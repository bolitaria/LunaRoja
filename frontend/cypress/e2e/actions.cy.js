describe('Actions CRUD', () => {
  before(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea una nueva acción', () => {
    cy.visit('/admin/actions/new');
    cy.get('input[name="title"]').type('Acción E2E');
    cy.get('textarea[name="description"]').type('Descripción de prueba');
    cy.get('select[name="category"]').select('protest');
    cy.get('button[type="submit"]').click();
    cy.contains('Acción creada correctamente').should('exist');
  });
});
  it('edita una acción existente', () => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.visit('/admin/actions');
    cy.get('a[href*="/admin/actions/"][href*="/edit"]').first().click();
    cy.get('input[name="title"]').clear().type('Acción E2E Editada');
    cy.get('button[type="submit"]').click();
    cy.contains('Acción actualizada').should('exist');
  });

  it('elimina una acción', () => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.visit('/admin/actions');
    cy.get('button[aria-label="Eliminar"]').first().click();
    cy.get('button[type="submit"]').click(); // confirmación
    cy.contains('eliminada').should('exist');
  });
