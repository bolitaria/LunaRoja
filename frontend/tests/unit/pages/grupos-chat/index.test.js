// tests/unit/pages/grupos-chat/index.test.js
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Page from '@/pages/grupos-chat/index';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

// Mock de router con query incluido
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},              // <- esencial para evitar undefined
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('Grupos-chat Page', () => {
  test('renders without crashing', async () => {
    render(<Page />);
    expect(screen.getByText('Grupos de Chat')).toBeInTheDocument();
  });
});