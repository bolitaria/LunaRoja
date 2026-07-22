import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Page from '@/pages/reportes/index';

jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false }) }));
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/', push: jest.fn() }) }));

describe('Reportes Page', () => {
  test('renders without crashing', async () => {
    render(<Page />);
    expect(screen.getByText('Blog y Reportes')).toBeInTheDocument();
  });
});