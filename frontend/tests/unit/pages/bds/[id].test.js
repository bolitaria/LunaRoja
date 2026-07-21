import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import BdsDetailPage from '@/pages/bds/[id]';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));
jest.mock('../../../../src/components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../../../src/lib/axios', () => ({ get: jest.fn(() => Promise.resolve({ data: {} })) }));

describe('Bds Detail Page', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ query: { id: '1' } });
  });

  test('renders loading state', () => {
    render(<BdsDetailPage />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });
});
