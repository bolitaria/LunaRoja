import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function AdminLayout({ children, title = 'Panel Admin' }) {
  const { user, logout } = useAuth();
  const router = useRouter();

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
  if (user) {
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
    superadmin: 'bg-green-500 text-white',
    campaign_admin: 'bg-yellow-500 text-black',
    action_admin: 'bg-orange-500 text-white',
  };

  const roleName = {
    superadmin: 'Superadmin',
    campaign_admin: 'Admin Campaña',
    action_admin: 'Admin Evento',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-gray-700">Admin</span>
          </Link>
        </div>

        {/* Navegación */}
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

        {/* Usuario y logout */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{user.username}</span>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${roleBadge[user.role] || 'bg-gray-100 text-gray-800'}`}>
                  {roleName[user.role] || user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Cabecera blanca minimalista */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
            <Link href="/" className="text-sm text-gray-500 hover:text-green-600 transition flex items-center gap-1">
              <img src="/logo.svg" alt="Logo" className="h-4 w-auto" />
              Ir al sitio público
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}