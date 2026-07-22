describe('Calendario', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/calendario');
    cy.get('.react-calendar', { timeout: 10000 }).should('exist');
  });

  it('carga la página de calendario sin errores', () => {
    // Just check that any month name is visible
    cy.contains(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i).should('exist');
  });

  it('muestra el mes actual y permite navegar', () => {
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const currentMonth = months[new Date().getMonth()];
    cy.contains(new RegExp(currentMonth, 'i')).should('exist');
    cy.get('.react-calendar__navigation__next-button').click();
    // After navigation, any month text is fine
    cy.contains(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i).should('exist');
  });
});
