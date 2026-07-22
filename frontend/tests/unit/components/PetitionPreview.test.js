import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PetitionPreview from '@/components/PetitionPreview';

const form = {
  title: 'Petición 1',
  content: 'Contenido de prueba',
  type: 'custom',
  urgency: true,
  deadline: null,
  targetEmails: [],
};

test('displays title and urgency badge', () => {
  render(<PetitionPreview form={form} />);
  expect(screen.getByText('Petición 1')).toBeInTheDocument();
  expect(screen.getByText(/urgente/i)).toBeInTheDocument();
});
