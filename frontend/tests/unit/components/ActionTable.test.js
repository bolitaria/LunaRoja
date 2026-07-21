import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ActionTable from '@/components/ActionTable';

const actions = [
  { id: 1, title: 'Acción 1', category: 'protest', datetime: new Date().toISOString() },
  { id: 2, title: 'Acción 2', category: 'talk', datetime: new Date().toISOString() },
];

test('renders table with actions', () => {
  render(<ActionTable actions={actions} />);
  expect(screen.getByText('Acción 1')).toBeInTheDocument();
  expect(screen.getByText('Acción 2')).toBeInTheDocument();
});

test('shows empty message when no actions', () => {
  render(<ActionTable actions={[]} />);
  expect(screen.getByText(/no hay acciones/i)).toBeInTheDocument();
});
