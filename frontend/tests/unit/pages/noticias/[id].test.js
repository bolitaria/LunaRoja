import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import NoticiasDetailPage from '@/pages/noticias/[id]';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));
jest.mock('../../../../src/components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../../../src/lib/axios', () => ({ get: jest.fn(() => Promise.resolve({ data: {} })) }));

describe('Noticias Detail Page', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ query: { id: '1' } });
  });

  test('renders loading state', () => {
    render(<NoticiasDetailPage />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });
});
