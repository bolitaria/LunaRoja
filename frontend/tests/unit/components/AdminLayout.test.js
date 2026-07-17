import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminLayout from '@/components/AdminLayout';

// Mock del router de Next.js para evitar "NextRouter was not mounted"
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock del contexto de autenticación
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', role: 'superadmin' },
    loading: false,
    logout: jest.fn(),
  }),
}));

test('renderiza el contenido dentro del layout', () => {
  render(
    <AdminLayout>
      <div>Contenido de prueba</div>
    </AdminLayout>
  );
  expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
});