import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ActionPreview from '@/components/ActionPreview';

describe('ActionPreview', () => {
  it('se renderiza sin errores', () => {
    render(<ActionPreview />);
    // Aquí puedes añadir expectativas personalizadas
  });
});
