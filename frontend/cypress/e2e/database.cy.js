describe('Base de datos', () => {
  beforeEach(() => {
    cy.login('admin', 'admin123');
  });

  it('carga la página de administración de la base de datos', () => {
    cy.visit('/admin/database');
    cy.contains('Base de datos').should('exist');
    // Verifica que aparezcan los controles para ejecutar consultas o ver tablas
    cy.get('textarea, input[type="text"]').should('exist');
    cy.contains('Ejecutar').should('exist');
  });
});
