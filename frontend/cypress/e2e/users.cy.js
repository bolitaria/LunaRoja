describe('Usuarios', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea un usuario', () => {
    cy.visit('/admin/users/new');
    cy.get('input[name="username"]').type('testuser_e2e');
    cy.get('input[name="password"]').type('SecurePass1');
    cy.get('select[name="role"]').select('action_admin');
    cy.get('button[type="submit"]').click();
    cy.contains('Usuario creado').should('exist');
  });

  it('edita el rol de un usuario', () => {
    cy.visit('/admin/users');
    cy.get('a[href*="/edit"]').first().click();
    cy.get('select[name="role"]').select('blog_admin');
    cy.get('button[type="submit"]').click();
    cy.contains('actualizado').should('exist');
  });

  it('elimina un usuario', () => {
    cy.visit('/admin/users');
    cy.get('button[type="submit"]').contains(/eliminar/i).click();
    cy.get('button[type="submit"]').click(); // confirmación
    cy.contains('eliminado').should('exist');
  });
});
