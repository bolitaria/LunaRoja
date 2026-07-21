describe('Public site', () => {
  it('navigates to main pages', () => {
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

  it('donations page loads', () => {
    cy.visit('/donaciones');
    cy.contains('Dona').should('exist');
  });

  it('subscription flow', () => {
    cy.visit('/subscribe');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Gracias').should('be.visible');
  });

  it('colectivos logos in footer', () => {
    cy.visit('/');
    cy.get('footer a[href="https://palestinalibre.org"]').should('exist'); // asumiendo el colectivo creado
  });
});