describe('Dashboard', () => {
    beforeEach(() => { cy.login(); });
  });

  it('muestra el panel de administración', () => {
    cy.url().should('include', '/admin');
    cy.contains('Estadísticas').should('exist'); // Ajusta según el texto real del dashboard
  });
});