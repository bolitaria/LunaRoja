// tests/unit/pages/admin/dashboard.test.js
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Page from '@/pages/admin/dashboard';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'superadmin' }, loading: false }),
}));

// Mock de AdminLayout corregido: renderiza el título dentro de un <h1>
jest.mock('@/components/AdminLayout', () => ({ children, title }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

test('renderiza la página', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});