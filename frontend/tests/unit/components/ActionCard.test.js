import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ActionCard from '@/components/ActionCard';

describe('ActionCard', () => {
  it('se renderiza sin errores', () => {
    render(<ActionCard />);
    // Aquí puedes añadir expectativas personalizadas
  });
});
