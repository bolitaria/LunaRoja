import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageDropzone from '@/components/ImageDropzone';

test('shows upload area', () => {
  render(<ImageDropzone />);
  expect(screen.getByText(/Subir imagen/)).toBeInTheDocument();
});

test('shows preview and remove button when imagePreview is set', () => {
  const handleRemove = jest.fn();
  render(<ImageDropzone imagePreview="/preview.jpg" onRemove={handleRemove} />);
  // The button's accessible name is "Vista previa" (derived from the img alt text)
  const removeBtn = screen.getByRole('button', { name: /Vista previa/i });
  fireEvent.click(removeBtn);
  expect(handleRemove).toHaveBeenCalled();
});
