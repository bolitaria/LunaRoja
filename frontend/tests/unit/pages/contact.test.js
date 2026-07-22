import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Page from '@/pages/contact';

jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>);

test('renderiza sin errores', () => {
  render(<Page />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});
