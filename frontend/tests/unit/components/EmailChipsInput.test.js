import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmailChipsInput from '@/components/EmailChipsInput';

test('añade un chip con email válido', () => {
  const onChange = jest.fn();
  render(<EmailChipsInput value={[]} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/correo/i);
  fireEvent.change(input, { target: { value: 'test@example.com' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  expect(onChange).toHaveBeenCalledWith(['test@example.com']);
});

test('no añade chip con email inválido', () => {
  const onChange = jest.fn();
  render(<EmailChipsInput value={[]} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/correo/i);
  fireEvent.change(input, { target: { value: 'invalid' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  expect(onChange).not.toHaveBeenCalled();
});