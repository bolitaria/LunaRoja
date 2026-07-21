import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '@/components/DataTable';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
];

const data = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];

test('renders table with data', () => {
  render(<DataTable columns={columns} data={data} selected={[]} />);
  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 2')).toBeInTheDocument();
});

test('select all / deselect all works', () => {
  const handleSelectAll = jest.fn();
  const handleSelectOne = jest.fn();
  const { container } = render(
    <DataTable
      columns={columns}
      data={data}
      selected={[]}
      onSelectAll={handleSelectAll}
      onSelectOne={handleSelectOne}
    />
  );
  // Get the checkbox in the thead
  const selectAllCheckbox = container.querySelector('thead input[type="checkbox"]');
  fireEvent.click(selectAllCheckbox);
  expect(handleSelectAll).toHaveBeenCalledWith([1, 2]);
});

test('calls onDelete when delete button clicked', () => {
  const handleDelete = jest.fn();
  const { container } = render(
    <DataTable columns={columns} data={data} selected={[]} onDelete={handleDelete} />
  );
  // Delete buttons have class action-btn-delete
  const deleteBtns = container.querySelectorAll('.action-btn-delete');
  fireEvent.click(deleteBtns[0]);
  expect(handleDelete).toHaveBeenCalledWith(1);
});
