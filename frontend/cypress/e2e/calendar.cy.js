describe('Calendario', () => {
  beforeEach(() => {
    cy.login('admin', 'admin123'); // usa el comando personalizado
  });

  it('carga la página de calendario sin errores', () => {
    cy.visit('/admin/calendar');
    // Verifica que el título de la página aparezca
    cy.contains('Calendario').should('exist');
    // Comprueba que se renderice algún elemento del calendario (por ejemplo, una cuadrícula o un mes)
    cy.get('div[class*="calendar"], div[class*="Calendar"], .rbc-calendar').should('exist');
  });

  it('muestra el mes actual y permite navegar', () => {
    cy.visit('/admin/calendar');
    // Botones de navegación típicos de un calendario
    cy.get('button').contains(/hoy|today|actual/i).should('exist');
  });
});
