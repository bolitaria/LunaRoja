import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionForm from '@/components/ActionForm';

jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('ActionForm – business logic', () => {
  test('shows online fields when locationType is online', () => {
    render(<ActionForm />);
    const typeSelect = screen.getByLabelText(/tipo de ubicación/i);
    fireEvent.change(typeSelect, { target: { value: 'online' } });
    expect(screen.getByPlaceholderText('https://forms.gle/...')).toBeInTheDocument();
  });

  test('shows map‑related fields when presencial', () => {
    render(<ActionForm />);
    const typeSelect = screen.getByLabelText(/tipo de ubicación/i);
    fireEvent.change(typeSelect, { target: { value: 'presencial' } });
    expect(screen.getByLabelText(/nombre del lugar/i)).toBeInTheDocument();
  });

  test('validates required fields on submit', async () => {
    const mockSubmit = jest.fn();
    render(<ActionForm onSubmit={mockSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => {
      // The HTML5 required validation will prevent submit, but we can check that the callback is NOT called
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  test('calls onSubmit with correct data when all required fields filled', async () => {
    const mockSubmit = jest.fn();
    render(<ActionForm onSubmit={mockSubmit} />);
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/fecha y hora/i), { target: { value: '2025-12-31T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test' }));
    });
  });
});
