describe('Actions CRUD', () => {
  before(() => {
    cy.visit('/admin/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type(Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.get('button[type="submit"]').click();
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