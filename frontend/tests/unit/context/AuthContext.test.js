import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import api from '../../../src/lib/axios';

jest.mock('../../../src/lib/axios');

// Mock del router de Next.js
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

describe('AuthContext', () => {
  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('login exitoso guarda token y usuario', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'fake-token', user: { id: 1, role: 'superadmin' } },
    });
    api.get.mockResolvedValueOnce({ data: { id: 1, role: 'superadmin' } });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login('admin', 'pass');
    });

    expect(result.current.user).toEqual({ id: 1, role: 'superadmin' });
    expect(localStorage.getItem('token')).toBe('fake-token');
  });

  test('logout limpia token y usuario', async () => {
    localStorage.setItem('token', 'valid-token');
    api.get.mockResolvedValueOnce({ data: { id: 1 } });
    api.post.mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
