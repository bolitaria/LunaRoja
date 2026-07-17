import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionForm from '@/components/ActionForm';

describe('ActionForm', () => {
  it('renderiza campos obligatorios', () => {
    render(<ActionForm />);
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
  });

  it('llama a onSubmit al enviar', () => {
    const onSubmit = jest.fn();
    render(<ActionForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/fecha y hora/i), { target: { value: '2026-12-31T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: /crear acción/i }));
    expect(onSubmit).toHaveBeenCalled();
  });
});