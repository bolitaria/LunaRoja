import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ColorPicker from '@/components/ColorPicker';

describe('ColorPicker', () => {
  it('se renderiza sin errores', () => {
    render(<ColorPicker />);
    // Aquí puedes añadir expectativas personalizadas
  });
});
