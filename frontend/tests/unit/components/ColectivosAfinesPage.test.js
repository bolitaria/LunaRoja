import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColectivosAfinesPage from '../../../src/pages/admin/colectivos-afines';
import api from '../../../src/lib/axios';

jest.mock('../../../src/lib/axios');

jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <>{children}</>,
}));

import { useAuth } from '@/context/AuthContext';

const mockUser = { id: 1, username: 'admin', role: 'superadmin' };

beforeEach(() => {
  useAuth.mockReturnValue({
    user: mockUser,
    loading: false,
    logout: jest.fn(),
  });
  api.get.mockResolvedValue({ data: [] });
  window.alert = jest.fn();   // mock alert
});

afterEach(() => {
  jest.clearAllMocks();
});

const renderPage = () => render(<ColectivosAfinesPage />);

describe('ColectivosAfinesPage', () => {
  test('shows error when GET fails', async () => {
    api.get.mockRejectedValueOnce({ response: { data: { message: 'Error al cargar' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Error al cargar')).toBeInTheDocument();
    });
  });

  test('shows error when POST fails', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Error al guardar' } } });
    renderPage();
    await userEvent.click(screen.getByText('Añadir Colectivo'));
    fireEvent.change(screen.getByPlaceholderText('https://ejemplo.org'), { target: { value: 'https://test.com' } });
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['dummy'], 'logo.png', { type: 'image/png' });
    await userEvent.upload(fileInput, file);
    await userEvent.click(screen.getByText('Crear Colectivo'));
    await waitFor(() => {
      // The component uses window.alert to show the error
      expect(window.alert).toHaveBeenCalledWith('Error al guardar');
    });
  });
});
