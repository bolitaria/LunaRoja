import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PasswordField from '@/components/PasswordField';

describe('PasswordField', () => {
  it('toggles password visibility when the user clicks the icon button', () => {
    render(
      <PasswordField
        label="Contraseña"
        name="password"
        value="secret"
        onChange={() => {}}
        required
      />
    );

    const input = screen.getByPlaceholderText('••••••••');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button'));

    expect(input).toHaveAttribute('type', 'text');
  });
});