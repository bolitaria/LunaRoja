describe('Reportes/Blog', () => {
  beforeEach(() => {
    cy.visit('/admin/login');
    cy.findByLabelText('Usuario').type('admin');
    cy.findByLabelText('Contraseña').type('admin123');
    cy.findByRole('button', { name: /ingresar/i }).click();
  });

  it('crea una entrada escribiendo contenido manualmente', () => {
    cy.visit('/admin/reports/new');
    cy.findByLabelText('Título *').type('Entrada de prueba');
    cy.findByLabelText('Descripción breve (opcional)').type('Descripción opcional');
    // Seleccionar "Escribir manualmente" (radio)
    cy.findByText('Escribir manualmente').click();
    // Esperar que el editor Quill esté visible (el contenedor)
    cy.get('.ql-editor').type('Contenido de prueba');
    cy.findByRole('button', { name: /crear entrada/i }).click();
    cy.contains('Entrada creada').should('exist');
  });

  it('crea una entrada subiendo un PDF', () => {
    cy.visit('/admin/reports/new');
    cy.findByLabelText('Título *').type('Entrada PDF');
    cy.findByText('Subir PDF').click();
    // Adjuntar un archivo PDF de prueba (crea uno pequeño en fixtures)
    cy.fixture('sample.pdf', 'base64').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent,
        fileName: 'sample.pdf',
        mimeType: 'application/pdf',
      });
    });
    cy.findByRole('button', { name: /crear entrada/i }).click();
    cy.contains('Entrada creada').should('exist');
  });

  it('edita una entrada y cambia de método', () => {
    cy.visit('/admin/reports');
    cy.get('a[href*="/edit"]').first().click();
    cy.findByLabelText('Título *').clear().type('Editada Cypress');
    // Cambiar a subir PDF
    cy.findByText('Subir PDF').click();
    cy.findByRole('button', { name: /guardar cambios/i }).click();
    cy.contains('Entrada actualizada').should('exist');
  });

  it('elimina una entrada', () => {
    cy.visit('/admin/reports');
    // Marcar checkbox y luego usar botón de eliminar seleccionados
    cy.get('tbody input[type="checkbox"]').first().check();
    cy.findByRole('button', { name: /eliminar/i }).click();
    cy.findByRole('button', { name: /confirmar/i }).click();
    cy.contains('eliminado(s)').should('exist');
  });
});