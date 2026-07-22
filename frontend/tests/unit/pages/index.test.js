import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '@/pages/index';
import api from '../../../src/lib/axios';
import { AuthProvider } from '@/context/AuthContext';

jest.mock('../../../src/lib/axios');

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/', push: jest.fn() }),
}));

jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('@/components/NewsCard', () => () => <div>NewsCard</div>);
jest.mock('@/components/ReportCard', () => () => <div>ReportCard</div>);
jest.mock('@/components/ActionCard', () => () => <div>ActionCard</div>);
jest.mock('@/components/GalleryCard', () => () => <div>GalleryCard</div>);

describe('Home Page', () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === '/news') return Promise.resolve({ data: [] });
      if (url === '/reportes') return Promise.resolve({ data: [] });
      if (url === '/actions') return Promise.resolve({ data: [] });
      if (url === '/images') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('not found'));
    });
  });

  test('renders section headers', async () => {
    render(<AuthProvider><Home /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByText('Galería')).toBeInTheDocument();
      expect(screen.getByText('Últimas Acciones')).toBeInTheDocument();
      expect(screen.getByText('Últimas Noticias')).toBeInTheDocument();
    });
  });

  test('shows action cards when data is loaded', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/actions') return Promise.resolve({ data: [{ id: 1, title: 'Acción Test' }] });
      if (url === '/news') return Promise.resolve({ data: [] });
      if (url === '/reportes') return Promise.resolve({ data: [] });
      if (url === '/images') return Promise.resolve({ data: [] });
    });
    render(<AuthProvider><Home /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByText('ActionCard')).toBeInTheDocument();
    });
  });
});
