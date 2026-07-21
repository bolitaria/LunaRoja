import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import GaleriaPage from '@/pages/galeria/index';

jest.mock('../../../../src/components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../../../src/lib/axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));

describe('Galeria Page', () => {
  test('renders without crashing', async () => {
    render(<GaleriaPage />);
    // Wait for loading to finish
    await screen.findByText(/cargando/i).catch(() => {});
    // Basic assertion: header exists
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
