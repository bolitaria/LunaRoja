import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageDropzone from '@/components/ImageDropzone';

test('muestra el área de subida', () => {
  render(<ImageDropzone />);
  expect(screen.getByText('Subir imagen')).toBeInTheDocument();
});

test('llama a onImageChange al seleccionar un archivo', () => {
  const onImageChange = jest.fn();
  render(<ImageDropzone onImageChange={onImageChange} />);
  const file = new File(['dummy'], 'test.png', { type: 'image/png' });
  // El input file está oculto, lo obtenemos por su etiqueta
  const input = screen.getByLabelText(/subir imagen/i).closest('label').querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });
  expect(onImageChange).toHaveBeenCalled();
});