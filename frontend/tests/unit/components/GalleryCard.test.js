import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import GalleryCard from '@/components/GalleryCard';

const item = { id: 1, title: 'Test Image', imageUrl: '/test.jpg' };

test('muestra la imagen', () => {
  render(<GalleryCard item={item} />);
  expect(screen.getByAltText('Test Image')).toBeInTheDocument();
});