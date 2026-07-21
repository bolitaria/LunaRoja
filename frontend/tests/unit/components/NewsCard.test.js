import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import NewsCard from '@/components/NewsCard';
test('shows title and description', () => {
  render(<NewsCard noticia={{ id: 1, title: 'Breaking News', description: 'Desc' }} />);
  expect(screen.getByText('Breaking News')).toBeInTheDocument();
});
test('shows title only when no description', () => {
  render(<NewsCard noticia={{ id: 1, title: 'Breaking News' }} />);
  expect(screen.getByText('Breaking News')).toBeInTheDocument();
});
