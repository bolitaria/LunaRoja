import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AdminLayout from '@/components/AdminLayout';

// Mock de next/router (necesario para el componente)
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    events: { on: jest.fn(), off: jest.fn() },
  }),
}));

// Mock del contexto de autenticación
import { useAuth } from '@/context/AuthContext';

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

function setRole(role) {
  useAuth.mockReturnValue({
    user: role ? { username: 'test', role } : null,
    loading: false,
    logout: jest.fn(),
  });
}

function renderLayout() {
  render(<AdminLayout title="Panel de Control"><div>Contenido de prueba</div></AdminLayout>);
}

beforeEach(() => {
  jest.clearAllMocks();
  setRole('superadmin'); // por defecto
});

describe('AdminLayout', () => {
  test('muestra el título de la página', () => {
    renderLayout();
    // Hay dos h1 con el mismo texto (uno oculto en móvil), usamos getAllByText
    const headings = screen.getAllByText('Panel de Control');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  test('renderiza el contenido hijo', () => {
    renderLayout();
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
  });

  describe('enlaces del menú según rol', () => {
    test('superadmin ve todos los enlaces de gestión', () => {
      setRole('superadmin');
      renderLayout();
      // Verifica elementos existentes en el menú de superadmin
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Acciones')).toBeInTheDocument();
      expect(screen.getByText('Campañas')).toBeInTheDocument();
      expect(screen.getByText('BDS')).toBeInTheDocument();
      expect(screen.getByText('Noticias')).toBeInTheDocument();
      expect(screen.getByText('Blog/Reportes')).toBeInTheDocument();
      expect(screen.getByText('Firma Peticiones')).toBeInTheDocument();
      expect(screen.getByText('Grupos de Chat')).toBeInTheDocument();
      expect(screen.getByText('Imágenes')).toBeInTheDocument();
      expect(screen.getByText('Base de Datos')).toBeInTheDocument();
      expect(screen.getAllByText('Colectivos Afines').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Administradores')).toBeInTheDocument();
      expect(screen.getByText('Plantillas Email')).toBeInTheDocument();
      expect(screen.getByText('Links de interés')).toBeInTheDocument();
    });

    test('campaign_admin ve solo campañas y acciones', () => {
      setRole('campaign_admin');
      renderLayout();
      // Menu campaign_admin incluye Dashboard, Acciones, Campañas, BDS, Noticias, Firma Peticiones, Grupos de Chat, Imágenes, Administradores, Mi Perfil
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Acciones')).toBeInTheDocument();
      expect(screen.getByText('Campañas')).toBeInTheDocument();
      expect(screen.getByText('BDS')).toBeInTheDocument();
      expect(screen.getByText('Noticias')).toBeInTheDocument();
      expect(screen.getByText('Firma Peticiones')).toBeInTheDocument();
      expect(screen.getByText('Grupos de Chat')).toBeInTheDocument();
      expect(screen.getByText('Imágenes')).toBeInTheDocument();
      expect(screen.getByText('Administradores')).toBeInTheDocument();
      // No debe tener Blog/Reportes, Base de Datos, Colectivos, Plantillas, Links
      expect(screen.queryByText('Blog/Reportes')).toBeNull();
      expect(screen.queryByText('Base de Datos')).toBeNull();
      expect(screen.queryByText('Colectivos Afines')).toBeNull();
      expect(screen.queryByText('Plantillas Email')).toBeNull();
      expect(screen.queryByText('Links de interés')).toBeNull();
    });

    test('action_admin ve solo acciones', () => {
      setRole('action_admin');
      renderLayout();
      // Menu action_admin: Dashboard, Acciones, Imágenes, Noticias, Mi Perfil
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Acciones')).toBeInTheDocument();
      expect(screen.getByText('Imágenes')).toBeInTheDocument();
      expect(screen.getByText('Noticias')).toBeInTheDocument();
      expect(screen.queryByText('Campañas')).toBeNull();
      expect(screen.queryByText('BDS')).toBeNull();
      expect(screen.queryByText('Administradores')).toBeNull();
    });

    test('usuario sin rol (null) no ve nada de administración', () => {
      setRole(null);
      render(<AdminLayout title="Test"><div>Hijo</div></AdminLayout>);
      // Redirige a login, así que el componente retorna null (no renderiza nada)
      // Verificamos que el contenido hijo no esté presente
      expect(screen.queryByText('Hijo')).toBeNull();
    });
  });

  test('muestra spinner mientras está cargando', () => {
    useAuth.mockReturnValue({ user: null, loading: true, logout: jest.fn() });
    render(<AdminLayout title="Test" />);
    // El spinner contiene elementos con clase animate-pulse
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});