import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal', () => {
  it('renders the confirmation actions and calls the handlers', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmModal
        isOpen
        title="Eliminar elemento"
        message="¿Deseas continuar?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
