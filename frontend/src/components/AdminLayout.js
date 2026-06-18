import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children, title = 'Panel Admin' }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Menús según rol
  const baseMenu = [
    { name: 'Dashboard', path: '/admin' },
  ];

  const superAdminMenu = [
    { name: 'Administradores', path: '/admin/users' },
    { name: 'Campañas', path: '/admin/campaigns' },
    { name: 'Acciones', path: '/admin/actions' },
    { name: 'Imágenes', path: '/admin/images' },
    { name: 'Noticias', path: '/admin/news' },
    { name: 'Reportes', path: '/admin/reports' },
    { name: 'Grupos de Chat', path: '/admin/chatGroups' },
    { name: 'Suscriptores', path: '/admin/subscribers' },
    { name: 'Base de Datos', path: '/admin/database' },
  ];

  const campaignAdminMenu = [
    { name: 'Administradores', path: '/admin/users' },
    { name: 'Campañas', path: '/admin/campaigns' },
    { name: 'Acciones', path: '/admin/actions' },
    { name: 'Imágenes', path: '/admin/images' },
    { name: 'Noticias', path: '/admin/news' },
    { name: 'Grupos de Chat', path: '/admin/chatGroups' },
  ];

  const actionAdminMenu = [
    { name: 'Acciones', path: '/admin/actions' },
    { name: 'Imágenes', path: '/admin/images' },
    { name: 'Noticias', path: '/admin/news' },
  ];

  let menu = [...baseMenu];
  if (user && user.role) {
    if (user.role === 'superadmin') {
      menu = [...baseMenu, ...superAdminMenu];
    } else if (user.role === 'campaign_admin') {
      menu = [...baseMenu, ...campaignAdminMenu];
    } else if (user.role === 'action_admin') {
      menu = [...baseMenu, ...actionAdminMenu];
    }
  }

  const profileItem = { name: 'Mi Perfil', path: '/admin/profile' };
  menu.push(profileItem);

  const roleBadge = {
    superadmin: 'bg-purple-600 text-white',
    campaign_admin: 'bg-orange-500 text-white',
    action_admin: 'bg-yellow-500 text-black',
  };

  const roleName = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Admin Campaña',
    action_admin: 'Admin Evento',
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-64 bg-white shadow-md flex flex-col">
          <div className="h-16 p-4 border-b border-gray-200 bg-white flex items-center">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </nav>
        </aside>
        <div className="flex-1 p-6">
          <div className="h-16 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/admin/login');
    }
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col flex-shrink-0">
        {/* Cabecera lateral: logo + usuario + salir, misma altura que la central */}
        <div className="h-16 px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 truncate max-w-[80px]">{user.username}</span>
            <button
              onClick={handleLogout}
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Menú */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menu.map(item => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    router.pathname === item.path
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${roleBadge[user.role] || 'bg-gray-100 text-gray-800'}`}>
              {roleName[user.role] || user.role}
            </span>
            <span className="text-sm text-gray-600 truncate">{user.username}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">ID: {user.id}</p>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Cabecera central: mismo alto y padding que la lateral */}
        <header className="h-16 px-4 py-2 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-green-600 transition flex items-center gap-1">
            <img src="/logo.svg" alt="Logo" className="h-4 w-auto" />
            Ir al sitio público
          </Link>
        </header>

        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}