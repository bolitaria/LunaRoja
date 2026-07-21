describe('Sitio Público', () => {
  it('navega a las páginas principales', () => {
    cy.visit('/');
    cy.contains('Campañas').click();
    cy.url().should('include', '/campanas');

    cy.visit('/');
    cy.contains('Acciones').click();
    cy.url().should('include', '/acciones');

    cy.visit('/');
    cy.contains('Noticias').click();
    cy.url().should('include', '/noticias');
  });

  it('página de donaciones carga', () => {
    cy.visit('/donaciones');
    cy.contains('Dona').should('exist');
  });

  it('flujo de suscripción', () => {
    cy.visit('/subscribe');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Gracias', { timeout: 10000 }).should('be.visible');
  });

  it('logos de colectivos en el footer', () => {
    cy.visit('/');
    cy.get('footer a[href="https://palestinalibre.org"]').should('exist');
  });
});
