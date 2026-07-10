import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  FaHome, FaBolt, FaBullhorn, FaUsers, FaImages, FaNewspaper,
  FaFileAlt, FaComments, FaEnvelope, FaDatabase, FaUserCog, FaSignOutAlt,
  FaArrowRight, FaChartPie, FaPenFancy
} from 'react-icons/fa';

export default function AdminLayout({ children, title = 'Panel Admin' }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const superAdminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie className="w-4 h-4" /> },
    { name: 'Acciones', path: '/admin/actions', icon: <FaBolt className="w-4 h-4" /> },
    { name: 'Campañas', path: '/admin/campaigns', icon: <FaBullhorn className="w-4 h-4" /> },
    { name: 'BDS', path: '/admin/bds', icon: <FaBullhorn className="w-4 h-4" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-4 h-4" /> },
    { name: 'Blog/Reportes', path: '/admin/reports', icon: <FaFileAlt className="w-4 h-4" /> },
    { name: 'Firma Peticiones', path: '/admin/petitions', icon: <FaPenFancy className="w-4 h-4" /> },
    { name: 'Grupos de Chat', path: '/admin/chatGroups', icon: <FaComments className="w-4 h-4" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-4 h-4" /> },
    { name: 'Documentos', path: '/admin/documents', icon: <FaFileAlt className="w-4 h-4" /> },
    { name: 'Suscriptores', path: '/admin/subscribers', icon: <FaEnvelope className="w-4 h-4" /> },
    { name: 'Plantillas Email', path: '/admin/email-templates', icon: <FaEnvelope className="w-4 h-4" /> },
    { name: 'Base de Datos', path: '/admin/database', icon: <FaDatabase className="w-4 h-4" /> },
    { name: 'Administradores', path: '/admin/users', icon: <FaUserCog className="w-4 h-4" /> },
  ];

  const campaignAdminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie className="w-4 h-4" /> },
    { name: 'Acciones', path: '/admin/actions', icon: <FaBolt className="w-4 h-4" /> },
    { name: 'Campañas', path: '/admin/campaigns', icon: <FaBullhorn className="w-4 h-4" /> },
    { name: 'BDS', path: '/admin/bds', icon: <FaBullhorn className="w-4 h-4" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-4 h-4" /> },
    { name: 'Firma Peticiones', path: '/admin/petitions', icon: <FaPenFancy className="w-4 h-4" /> },
    { name: 'Grupos de Chat', path: '/admin/chatGroups', icon: <FaComments className="w-4 h-4" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-4 h-4" /> },
    { name: 'Documentos', path: '/admin/documents', icon: <FaFileAlt className="w-4 h-4" /> },
    { name: 'Administradores', path: '/admin/users', icon: <FaUserCog className="w-4 h-4" /> },
  ];

  const actionAdminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie className="w-4 h-4" /> },
    { name: 'Acciones', path: '/admin/actions', icon: <FaBolt className="w-4 h-4" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-4 h-4" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-4 h-4" /> },
    { name: 'Documentos', path: '/admin/documents', icon: <FaFileAlt className="w-4 h-4" /> },
  ];

  let menu = [];
  if (user && user.role) {
    if (user.role === 'superadmin') menu = superAdminMenu;
    else if (user.role === 'campaign_admin') menu = campaignAdminMenu;
    else if (user.role === 'action_admin') menu = actionAdminMenu;
  }

  menu.push({ name: 'Mi Perfil', path: '/admin/profile', icon: <FaUserCog className="w-4 h-4" /> });

  const groupDefinitions = [
    { label: 'Principal', keys: ['Dashboard'] },
    { label: 'Campañas y Comunicación', keys: ['Acciones', 'Campañas', 'BDS', 'Noticias', 'Blog/Reportes', 'Firma Peticiones', 'Grupos de Chat'] },
    { label: 'Contenido y Datos', keys: ['Imágenes', 'Documentos', 'Suscriptores', 'Base de Datos'] },
    { label: 'Administración', keys: ['Administradores', 'Plantillas Email', 'Mi Perfil'] },
  ];

  const groupedMenu = groupDefinitions.map(group => ({
    label: group.label,
    items: menu.filter(item => group.keys.includes(item.name)),
  })).filter(group => group.items.length > 0);

  // Colores según rol: verde neón para Superadmin
  const roleStyles = {
    superadmin: { bg: 'bg-green-400', text: 'text-black', label: 'Superadmin' },
    campaign_admin: { bg: 'bg-orange-500', text: 'text-white', label: 'Admin Campaña' },
    action_admin: { bg: 'bg-yellow-400', text: 'text-black', label: 'Admin Acción' },
    blog_admin: { bg: 'bg-purple-600', text: 'text-white', label: 'Blog Admin' },
  };

  const getRoleStyle = (role) => {
    return roleStyles[role] || { bg: 'bg-gray-500', text: 'text-white', label: role || 'Usuario' };
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex">
        <aside className="w-56 bg-white shadow-md flex flex-col">
          <div className="h-20 p-4 border-b border-gray-200 bg-white flex items-center">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[1, 2, 3].map(i => (<div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />))}
          </nav>
        </aside>
        <div className="flex-1 p-6">
          <div className="h-20 bg-gray-200 rounded animate-pulse mb-4" />
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

  const handleLogout = () => logout();

  const roleStyle = getRoleStyle(user.role);
  const roleLabel = roleStyle.label;
  const roleBg = roleStyle.bg;
  const roleText = roleStyle.text;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <div className="flex flex-1">
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm">
          {/* Sidebar header */}
          <div className="h-20 px-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Logo" className="h-14 w-auto" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <p className="text-sm font-medium text-gray-800 leading-tight">{user.username}</p>
                <p className={`text-xs font-medium ${roleText} ${roleBg} px-2 py-0.5 rounded-full inline-block mt-0.5`}>
                  {roleLabel}
                </p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Cerrar sesión">
                <FaSignOutAlt className="w-4 h-4" />
              </button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {groupedMenu.map((group) => (
              <div key={group.label}>
                <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</h3>
                <ul className="space-y-1">
                  {group.items.map(item => {
                    const isActive = router.pathname === item.path || router.pathname.startsWith(item.path + '/');
                    return (
                      <li key={item.path}>
                        <Link href={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                          <span className="flex-shrink-0">{item.icon}</span> {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Header principal: pestaña ocupa la mitad izquierda, bloque derecho la otra mitad */}
          <header className="h-20 bg-gradient-to-r from-[#F2856D] to-[#F2A7B3] flex items-end justify-between px-6 sticky top-0 z-10 border-b border-stone-200">
            {/* Pestaña izquierda - ocupa el 50% del ancho */}
            <div className="w-1/2 flex items-end h-full">
              <div className="bg-white border border-stone-200 border-b-0 rounded-t-lg px-5 py-3 w-full">
                <h1 className="text-stone-700 text-xl font-semibold leading-tight truncate">
                  {title}
                </h1>
              </div>
            </div>

            {/* Bloque derecho - ocupa el otro 50%, centrado verticalmente */}
            <div className="w-1/2 flex-shrink-0 flex items-center justify-end gap-4 self-center">
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-800 leading-tight">{user.username}</span>
                  <span className={`text-xs font-medium ${roleText} ${roleBg} px-2 py-0.5 rounded-full inline-block mt-0.5 border-2 border-gray-300`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 border-2 border-gray-300 bg-white/10 hover:bg-white/30 px-4 py-1.5 rounded-full transition-colors flex-shrink-0">
                <span className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                  <img src="/logo.svg" alt="Logo" className="h-4 w-auto" />
                </span>
                Ir al sitio público <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
      <footer className="bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Voces Palestinas por la Justicia</p>
        <nav className="flex gap-4 mt-2 sm:mt-0">
          <Link href="/admin/help" className="hover:text-purple-600">Ayuda</Link>
          <Link href="/admin/privacy" className="hover:text-purple-600">Privacidad</Link>
        </nav>
      </footer>
    </div>
  );
}