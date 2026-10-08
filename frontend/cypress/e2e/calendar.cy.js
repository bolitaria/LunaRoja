/// <reference types="cypress" />

const MONTHS_REGEX = /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i;

describe('Calendario público', () => {
  // La página /calendario es pública (no requiere login)
  beforeEach(() => {
    cy.visit('/calendario');
    cy.get('.react-calendar', { timeout: 15000 }).should('be.visible');
  });

  it('carga el calendario sin errores', () => {
    cy.contains(MONTHS_REGEX).should('be.visible');
  });

  it('permite navegar al mes siguiente', () => {
    // Captura el texto del mes actual antes de navegar
    cy.get('.react-calendar__navigation__label')
      .invoke('text')
      .then((beforeText) => {
        cy.get('.react-calendar__navigation__next-button')
          .should('be.visible')
          .click();

        // El mes debe haber cambiado (label distinto)
        cy.get('.react-calendar__navigation__label')
          .invoke('text')
          .should('not.eq', beforeText);
      });
  });

  it('permite navegar al mes anterior', () => {
    cy.get('.react-calendar__navigation__prev-button')
      .should('be.visible')
      .click();
    cy.contains(MONTHS_REGEX).should('exist');
  });
});
