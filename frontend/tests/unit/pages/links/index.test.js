import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LinksPage from '@/pages/links/index';

jest.mock('../../../../src/components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../../../src/lib/axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));

describe('Links Page', () => {
  test('renders without crashing', async () => {
    render(<LinksPage />);
    // Wait for loading to finish
    await screen.findByText(/cargando/i).catch(() => {});
    // Basic assertion: header exists
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
