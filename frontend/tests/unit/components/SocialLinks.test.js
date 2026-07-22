import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SocialLinks from '@/components/SocialLinks';

test('renderiza enlace de Instagram', () => {
  render(<SocialLinks />);
  const link = screen.getByRole('link', { name: /instagram/i });
  expect(link).toBeInTheDocument();
});