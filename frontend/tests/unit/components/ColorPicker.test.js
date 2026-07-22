import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ColorPicker from '@/components/ColorPicker';

test('opens popup on click', () => {
  render(<ColorPicker value="#ff0000" onChange={() => {}} />);
  const button = screen.getByRole('button', { name: /color/i });
  fireEvent.click(button);
  expect(screen.getByText('Cerrar')).toBeInTheDocument();
});

test('selects a preset color', () => {
  const handleChange = jest.fn();
  render(<ColorPicker value="#ff0000" onChange={handleChange} />);
  fireEvent.click(screen.getByRole('button', { name: /color/i }));
  // el primer preset es #FF0000, hacemos clic en el siguiente para cambiar
  const presetButtons = document.querySelectorAll('button[title]');
  fireEvent.click(presetButtons[1]); // el primer botón sin contar el de color
  expect(handleChange).toHaveBeenCalledWith(expect.any(String));
});

test('closes popup when clicking outside', () => {
  render(<ColorPicker value="#ff0000" onChange={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /color/i }));
  fireEvent.mouseDown(document.body);
  expect(screen.queryByText('Cerrar')).not.toBeInTheDocument();
});
