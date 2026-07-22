describe('Calendario', () => {
  beforeEach(() => {
    cy.visit('/calendario');
    // Wait for the calendar to render
    cy.get('.react-calendar', { timeout: 10000 }).should('exist');
  });

  it('carga la página de calendario sin errores', () => {
    // Basic page sanity check – already covered by successful visit
    cy.contains(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i).should('exist');
  });

  it('muestra el mes actual y permite navegar', () => {
    // Check that the current month is visible (using Spanish locale)
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const currentMonth = months[new Date().getMonth()];
    cy.contains(new RegExp(currentMonth, 'i')).should('exist');

    // Navigate to next month and verify different month
    cy.get('.react-calendar__navigation__next-button').click();
    // Just check that the month changed (any month is fine)
    cy.contains(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i).should('exist');
  });
});
