import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import AdminIndex from '@/pages/admin/index';
jest.mock('next/router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
test('redirects without error', () => {
  const { container } = render(<AdminIndex />);
  expect(container.firstChild).toBeNull();
});
