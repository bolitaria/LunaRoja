import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import DataTable from '@/components/DataTable';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
];
const data = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];

test('muestra los datos', () => {
  render(<DataTable columns={columns} data={data} />);
  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 2')).toBeInTheDocument();
});

test('no muestra filas cuando no hay datos', () => {
  render(<DataTable columns={columns} data={[]} />);
  expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
});