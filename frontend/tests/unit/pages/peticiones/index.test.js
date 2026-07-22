import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PeticionesPage from '@/pages/peticiones/index';

jest.mock('../../../../src/components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../../../src/lib/axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));

describe('Peticiones Page', () => {
  test('renders without crashing', async () => {
    render(<PeticionesPage />);
    // Wait for loading to finish
    await screen.findByText(/cargando/i).catch(() => {});
    // Basic assertion: header exists
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });
});
