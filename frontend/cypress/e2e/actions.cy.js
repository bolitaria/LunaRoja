describe('Acciones', () => {
  beforeEach(() => {
    cy.visit('/admin/login');
    cy.get('[data-cy="username-input"]').type('admin');
    cy.get('input[type="password"]').type('admin123'); // Ajusta a tu contraseña
    cy.findByRole('button', { name: /ingresar/i }).click();
    cy.url().should('include', '/admin');
  });

  it('crea una nueva acción', () => {
    cy.visit('/admin/actions/new');
    cy.findByLabelText('Título *').type('Acción Cypress');
    cy.findByLabelText('Descripción').type('Descripción de prueba');
    cy.findByLabelText('Fecha y hora *').type('2026-12-31T10:00');
    cy.findByLabelText('Tipo de ubicación').select('presencial');
    cy.findByLabelText('Dirección *').type('Calle Test 123');
    cy.findByLabelText('Nombre del lugar').type('Plaza Mayor');
    // Vincular a Ninguna
    cy.findByText('Ninguna').click();
    cy.findByLabelText('Categoría *').select('Manifestación');
    cy.findByRole('button', { name: /crear acción/i }).click();
    cy.contains('Acción creada').should('exist');
  });

  it('edita una acción existente', () => {
    cy.visit('/admin/actions');
    cy.get('a[href*="/edit"]').first().click();
    cy.findByLabelText('Título *').clear().type('Editada Cypress');
    cy.findByRole('button', { name: /actualizar acción/i }).click();
    cy.contains('Acción actualizada').should('exist');
  });

  it('elimina una acción', () => {
    cy.visit('/admin/actions');
    // Busca un botón con el título "Eliminar" (puede ser un icono de trash)
    cy.get('[title="Eliminar"]').first().click();
    cy.findByRole('button', { name: /confirmar/i }).click();
    cy.contains('Acción eliminada').should('exist');
  });
});