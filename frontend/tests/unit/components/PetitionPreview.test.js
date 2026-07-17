import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PetitionPreview from '@/components/PetitionPreview';

const form = {
  title: 'Petición 1',
  content: '',
  type: 'custom',
  urgency: false,
  deadline: null,
  targetEmails: [],
  externalUrl: '',
  signature_fields: [],
  featured_image: '',
};

test('muestra el título de la petición', () => {
  render(<PetitionPreview form={form} />);
  expect(screen.getByText('Petición 1')).toBeInTheDocument();
});