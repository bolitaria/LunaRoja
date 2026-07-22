/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AdminUser from '@/components/AdminUser';

// Mock de next/router (necesario para el componente)
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    events: { on: jest.fn(), off: jest.fn() },
  }),
}));

// Mock de useAuth para que devuelva un usuario
import { useAuth } from '@/context/AuthContext';
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

beforeEach(() => {
  useAuth.mockReturnValue({
    user: { username: 'admin', role: 'superadmin' },
    loading: false,
    logout: jest.fn(),
  });
});

test('renders user info', () => {
  render(<AdminUser />);
  // El componente muestra el nombre de usuario actual (admin)
  expect(screen.getByText('admin')).toBeInTheDocument();
});
