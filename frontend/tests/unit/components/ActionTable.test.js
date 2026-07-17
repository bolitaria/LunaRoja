import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ActionTable from '@/components/ActionTable';

describe('ActionTable', () => {
  it('se renderiza sin errores', () => {
    render(<ActionTable />);
    // Aquí puedes añadir expectativas personalizadas
  });
});
