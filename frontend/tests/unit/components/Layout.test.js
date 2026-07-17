import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '@/components/Layout';

describe('Layout', () => {
  it('se renderiza sin errores', () => {
    render(<Layout />);
    // Aquí puedes añadir expectativas personalizadas
  });
});
