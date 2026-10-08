import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AccionesPage from '@/pages/acciones/index';

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    asPath: '/',
    route: '/',
    isReady: true,
  }),
}));

jest.mock('../../../../src/components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../../../src/lib/axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));

describe('Acciones Page', () => {
  test('renders without crashing', async () => {
    render(<AccionesPage />);
    // Wait for loading to finish
    // Basic assertion: header exists
    expect(screen.getByRole('heading', { level: 1, name: /acciones/i })).toBeInTheDocument();
  });
});
