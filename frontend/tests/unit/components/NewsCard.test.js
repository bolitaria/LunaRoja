import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import NewsCard from '@/components/NewsCard';

const noticia = { id: 1, title: 'Breaking News', description: 'Desc' };

test('muestra el título de la noticia', () => {
  render(<NewsCard noticia={noticia} />);
  expect(screen.getByText('Breaking News')).toBeInTheDocument();
});