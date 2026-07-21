import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Layout from '@/components/Layout';

global.fetch = jest.fn((url) => {
  if (url === '/api/colectivosAfines/public') {
    return Promise.resolve({
      json: () => Promise.resolve({
        data: [
          { id: 1, nombre: 'Logo 1', url: '/uploads/colectivos/logo1.png', link: 'https://example.com/1' },
          { id: 2, nombre: 'Logo 2', url: '/uploads/colectivos/logo2.png', link: 'https://example.com/2' },
          { id: 3, nombre: 'Logo 3', url: '/uploads/colectivos/logo3.png', link: 'https://example.com/3' },
          { id: 4, nombre: 'Logo 4', url: '/uploads/colectivos/logo4.png', link: 'https://example.com/4' },
          { id: 5, nombre: 'Logo 5', url: '/uploads/colectivos/logo5.png', link: 'https://example.com/5' },
          { id: 6, nombre: 'Logo 6', url: '/uploads/colectivos/logo6.png', link: 'https://example.com/6' },
          { id: 7, nombre: 'Logo 7', url: '/uploads/colectivos/logo7.png', link: 'https://example.com/7' },
          { id: 8, nombre: 'Logo 8', url: '/uploads/colectivos/logo8.png', link: 'https://example.com/8' },
          { id: 9, nombre: 'Logo 9', url: '/uploads/colectivos/logo9.png', link: 'https://example.com/9' },
          { id: 10, nombre: 'Logo 10', url: '/uploads/colectivos/logo10.png', link: 'https://example.com/10' },
        ]
      }),
    });
  }
  return Promise.resolve({ json: () => Promise.resolve({ data: [] }) });
});

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

jest.mock('next/image', () => (props) => <img {...props} />);

describe('Layout – Footer logos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  it('renders the footer with 10 logos loaded from the API', async () => {
    render(<Layout />);

    // Wait for first logo to appear
    await waitFor(() => {
      expect(screen.getByAltText('Logo 1')).toBeInTheDocument();
    });

    // Count only the images that represent logos (alt starts with "Logo")
    const logoImages = screen.getAllByAltText(/^Logo \d+$/);
    expect(logoImages.length).toBe(10);

    // Verify that the first and last logo links point to the correct URLs
    const firstLink = logoImages[0].closest('a');
    const lastLink = logoImages[9].closest('a');
    expect(firstLink).toHaveAttribute('href', 'https://example.com/1');
    expect(lastLink).toHaveAttribute('href', 'https://example.com/10');
  });

  it('shows "Cargando logos…" when API returns no logos', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/colectivosAfines/public') {
        return Promise.resolve({ json: () => Promise.resolve({ data: [] }) });
      }
      return Promise.resolve({ json: () => Promise.resolve({ data: [] }) });
    });

    render(<Layout />);

    await waitFor(() => {
      expect(screen.getByText(/cargando logos/i)).toBeInTheDocument();
    });
  });
});
