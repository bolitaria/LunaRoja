import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import GalleryCard from '@/components/GalleryCard';
test('shows image with correct alt text', () => {
  render(<GalleryCard item={{ id: 1, imageUrl: '/test.jpg', title: 'Test Image' }} />);
  expect(screen.getByAltText('Test Image')).toBeInTheDocument();
});
test('uses generic alt when no title', () => {
  render(<GalleryCard item={{ id: 1, imageUrl: '/test.jpg' }} />);
  expect(screen.getByAltText('Imagen de galería')).toBeInTheDocument();
});
