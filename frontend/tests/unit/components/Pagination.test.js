import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
  it('renders page controls and calls onPageChange when selecting a page', () => {
    const onPageChange = jest.fn();

    render(<Pagination currentPage={2} totalPages={3} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: /anterior/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
