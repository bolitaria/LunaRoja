import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  FaHome, FaCalendarAlt, FaBullhorn, FaUsers, FaImages, FaNewspaper,
  FaFileAlt, FaComments, FaEnvelope, FaDatabase, FaUserCog, FaSignOutAlt, FaArrowRight
} from 'react-icons/fa';

export default function AdminLayout({ children, title = 'Panel Admin' }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Menús según rol (sin Dashboard)
  const superAdminMenu = [
    { name: 'Acciones', path: '/admin/actions', icon: <FaCalendarAlt className="w-4 h-4" /> },
    { name: 'Campañas', path: '/admin/campaigns', icon: <FaBullhorn className="w-4 h-4" /> },
    { name: 'BDS', path: '/admin/bds', icon: <FaDatabase className="w-4 h-4" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-4 h-4" /> },
    { name: 'Reportes', path: '/admin/reports', icon: <FaFileAlt className="w-4 h-4" /> },
    { name: 'Grupos de Chat', path: '/admin/chatGroups', icon: <FaComments className="w-4 h-4" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-4 h-4" /> },
    { name: 'Documentos', path: '/admin/documents', icon: <FaFileAlt className="w-4 h-4" /> },
    { name: 'Suscriptores', path: '/admin/subscribers', icon: <FaEnvelope className="w-4 h-4" /> },
    { name: 'Base de Datos', path: '/admin/database', icon: <FaDatabase className="w-4 h-4" /> },
    { name: 'Administradores', path: '/admin/users', icon: <FaUserCog className="w-4 h-4" /> },
  ];

  const campaignAdminMenu = [
    { name: 'Acciones', path: '/admin/actions', icon: <FaCalendarAlt className="w-4 h-4" /> },
    { name: 'Campañas', path: '/admin/campaigns', icon: <FaBullhorn className="w-4 h-4" /> },
    { name: 'BDS', path: '/admin/bds', icon: <FaDatabase className="w-4 h-4" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-4 h-4" /> },
    { name: 'Grupos de Chat', path: '/admin/chatGroups', icon: <FaComments className="w-4 h-4" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-4 h-4" /> },
    { name: 'Documentos', path: '/admin/documents', icon: <FaFileAlt className="w-4 h-4" /> },
    { name: 'Administradores', path: '/admin/users', icon: <FaUserCog className="w-4 h-4" /> },
  ];

  const actionAdminMenu = [
    { name: 'Acciones', path: '/admin/actions', icon: <FaCalendarAlt className="w-4 h-4" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-4 h-4" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-4 h-4" /> },
    { name: 'Documentos', path: '/admin/documents', icon: <FaFileAlt className="w-4 h-4" /> },
  ];

  let menu = [];
  if (user && user.role) {
    if (user.role === 'superadmin') {
      menu = superAdminMenu;
    } else if (user.role === 'campaign_admin') {
      menu = campaignAdminMenu;
    } else if (user.role === 'action_admin') {
      menu = actionAdminMenu;
    }
  }

  const profileItem = { name: 'Mi Perfil', path: '/admin/profile', icon: <FaUserCog className="w-4 h-4" /> };
  menu.push(profileItem);

  // Agrupación visual de items del menú
  const groupDefinitions = [
    { label: 'Campañas y Comunicación', keys: ['Acciones', 'Campañas', 'BDS', 'Noticias', 'Reportes', 'Grupos de Chat'] },
    { label: 'Contenido y Datos', keys: ['Imágenes', 'Documentos', 'Suscriptores', 'Base de Datos'] },
    { label: 'Administración', keys: ['Administradores', 'Mi Perfil'] },
  ];

  const groupedMenu = groupDefinitions.map(group => ({
    label: group.label,
    items: menu.filter(item => group.keys.includes(item.name)),
  })).filter(group => group.items.length > 0);

  const roleBadgeClass = 'bg-purple-100 text-purple-800';
  const roleName = {
    superadmin: 'Superadmin',
    campaign_admin: 'Admin Campaña',
    action_admin: 'Admin Acción',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Esqueleto de carga
  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-56 bg-white shadow-md flex flex-col">
          <div className="h-14 p-4 border-b border-gray-200 bg-white flex items-center">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </nav>
        </aside>
        <div className="flex-1 p-6">
          <div className="h-14 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined' && router.pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Contenedor principal: sidebar + área de contenido */}
      <div className="flex flex-1">
        {/* Sidebar: ahora blanco, como la cabecera y el contenido */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Cabecera del sidebar */}
          <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="h-7 w-auto" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 truncate max-w-[60px]">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2 py-1 rounded-full transition-colors flex items-center gap-1"
                title="Cerrar sesión"
              >
                <FaSignOutAlt className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Menú agrupado */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {groupedMenu.map((group) => (
              <div key={group.label}>
                <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {group.label}
                </h3>
                <ul className="space-y-1">
                  {group.items.map(item => {
                    const isActive = router.pathname === item.path || router.pathname.startsWith(item.path + '/');
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-purple-400 text-white shadow-sm shadow-purple-200'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <span className="flex-shrink-0">{item.icon}</span>
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Pie del sidebar */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold text-sm">
                {getInitials(user.username)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{user.username}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${roleBadgeClass}`}>
                  {roleName[user.role] || user.role}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Cabecera verde bandera palestina */}
          <header className="h-14 bg-gradient-to-r from-[#007A3D] to-[#009B4D] shadow-sm flex items-center justify-between px-6 sticky top-0 z-10 border-b border-[#005C2E]">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {title}
              </h1>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                {roleName[user.role] || user.role}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-green-900 bg-white shadow-sm hover:shadow-md hover:bg-green-50 transition-all px-4 py-1.5 rounded-full flex items-center gap-2"
              >
                <img src="/logo.svg" alt="Logo" className="h-4 w-auto" />
                Ir al sitio público
                <FaArrowRight className="w-3 h-3" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(user.username)}
                </div>
                <span className="text-sm font-medium text-white hidden sm:inline">{user.username}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>

      {/* Footer para toda la página */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Mi Aplicación. Todos los derechos reservados.</p>
        <nav className="flex gap-4 mt-2 sm:mt-0">
          <Link href="/admin/help" className="hover:text-green-600 transition">Ayuda</Link>
          <Link href="/admin/privacy" className="hover:text-green-600 transition">Privacidad</Link>
        </nav>
      </footer>
    </div>
  );
}