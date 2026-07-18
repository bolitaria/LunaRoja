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