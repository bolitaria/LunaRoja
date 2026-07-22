jest.mock('next/router', () => ({ useRouter: jest.fn().mockReturnValue({ route: '/', pathname: '/', query: {}, asPath: '/', push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn(), events: { on: jest.fn(), off: jest.fn() } }) }));
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Page from '@/pages/unsubscribe';

jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>);

test('renderiza sin errores', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});
