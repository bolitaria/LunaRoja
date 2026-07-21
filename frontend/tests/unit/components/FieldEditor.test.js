import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import FieldEditor from '@/components/FieldEditor';

const fields = [
  { name: 'f1', label: 'Label 1', type: 'text', required: false, unique: false },
];

test('adds a new field', () => {
  const handleChange = jest.fn();
  render(<FieldEditor fields={fields} onChange={handleChange} />);
  const addBtn = screen.getByText(/Añadir campo/);
  fireEvent.click(addBtn);
  expect(handleChange).toHaveBeenCalledWith([
    ...fields,
    { name: '', label: '', type: 'text', required: false, unique: false },
  ]);
});

test('removes a field', () => {
  const handleChange = jest.fn();
  render(<FieldEditor fields={fields} onChange={handleChange} />);
  const removeBtn = screen.getByText('✕');
  fireEvent.click(removeBtn);
  expect(handleChange).toHaveBeenCalledWith([]);
});

test('updates field type', () => {
  const handleChange = jest.fn();
  render(<FieldEditor fields={fields} onChange={handleChange} />);
  const select = screen.getByDisplayValue('Texto'); // el select muestra 'Texto' para type='text'
  fireEvent.change(select, { target: { value: 'email' } });
  expect(handleChange).toHaveBeenCalledWith([
    { ...fields[0], type: 'email' },
  ]);
});
