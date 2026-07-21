// tests/unit/pages/admin/calendar.test.js
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Page from '@/pages/admin/calendar';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'superadmin' }, loading: false }),
}));

// Mock de AdminLayout con h1
jest.mock('@/components/AdminLayout', () => ({ children, title }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

// Mock de router (con query, aunque no se use, por completitud)
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    query: {},
    push: jest.fn(),
  }),
}));

test('renderiza la página', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});