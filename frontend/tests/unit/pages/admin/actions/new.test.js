import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Page from '@/pages/admin/actions/new';

jest.mock('@/components/AdminLayout', () => ({ children, title }) => <div><h1>{title}</h1>{children}</div>);
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { role: 'superadmin' }, loading: false }) }));
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/', push: jest.fn() }) }));

test('renderiza la página', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});
