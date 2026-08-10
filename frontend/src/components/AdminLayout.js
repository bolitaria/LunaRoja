import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  FaBolt, FaBullhorn, FaImages, FaNewspaper,
  FaFileAlt, FaComments, FaEnvelope, FaDatabase, FaUserCog, FaSignOutAlt,
  FaArrowRight, FaChartPie, FaPenFancy, FaLink, FaHandshake, FaBars
} from 'react-icons/fa';

export default function AdminLayout({ children, title = 'Panel Admin' }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => { setSidebarOpen(false); }, [router.pathname]);

  // Etiquetas y colores de rol
  const roleLabels = {
    superadmin: 'Superadmin',
    campaign_admin: 'Admin. Campañas',
    bds_admin: 'Admin. BDS',
    action_admin: 'Admin. Acción',
    blog_admin: 'Admin. Blog',
  };

  const roleColors = {
    superadmin: 'bg-lime-400 text-black',
    campaign_admin: 'bg-blue-500 text-black',
    action_admin: 'bg-orange-500 text-black',
    bds_admin: 'bg-purple-500 text-black',
    blog_admin: 'bg-pink-500 text-black',
  };

  const roleColor = (role) => roleColors[role] || 'bg-[#009639] text-black';

  const superAdminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie className="w-5 h-5" /> },
    { name: 'Acciones', path: '/admin/actions', icon: <FaBolt className="w-5 h-5" /> },
    { name: 'Campañas', path: '/admin/campaigns', icon: <FaBullhorn className="w-5 h-5" /> },
    { name: 'BDS', path: '/admin/bds', icon: <FaBullhorn className="w-5 h-5" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-5 h-5" /> },
    { name: 'Blog/Reportes', path: '/admin/reports', icon: <FaFileAlt className="w-5 h-5" /> },
    { name: 'Firma Peticiones', path: '/admin/petitions', icon: <FaPenFancy className="w-5 h-5" /> },
    { name: 'Grupos de Chat', path: '/admin/chatGroups', icon: <FaComments className="w-5 h-5" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-5 h-5" /> },
    { name: 'Base de Datos', path: '/admin/database', icon: <FaDatabase className="w-5 h-5" /> },
    { name: 'Colectivos Afines', path: '/admin/colectivos-afines', icon: <FaHandshake className="w-5 h-5" /> },
    { name: 'Administradores', path: '/admin/users', icon: <FaUserCog className="w-5 h-5" /> },
    { name: 'Plantillas Email', path: '/admin/email-templates', icon: <FaEnvelope className="w-5 h-5" /> },
    { name: 'Links de interés', path: '/admin/links', icon: <FaLink className="w-5 h-5" /> },
  ];

  const campaignAdminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie className="w-5 h-5" /> },
    { name: 'Acciones', path: '/admin/actions', icon: <FaBolt className="w-5 h-5" /> },
    { name: 'Campañas', path: '/admin/campaigns', icon: <FaBullhorn className="w-5 h-5" /> },
    { name: 'BDS', path: '/admin/bds', icon: <FaBullhorn className="w-5 h-5" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-5 h-5" /> },
    { name: 'Firma Peticiones', path: '/admin/petitions', icon: <FaPenFancy className="w-5 h-5" /> },
    { name: 'Grupos de Chat', path: '/admin/chatGroups', icon: <FaComments className="w-5 h-5" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-5 h-5" /> },
    { name: 'Administradores', path: '/admin/users', icon: <FaUserCog className="w-5 h-5" /> },
  ];

  const actionAdminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaChartPie className="w-5 h-5" /> },
    { name: 'Acciones', path: '/admin/actions', icon: <FaBolt className="w-5 h-5" /> },
    { name: 'Imágenes', path: '/admin/images', icon: <FaImages className="w-5 h-5" /> },
    { name: 'Noticias', path: '/admin/news', icon: <FaNewspaper className="w-5 h-5" /> },
  ];

  let menu = [];
  if (user && user.role) {
    if (user.role === 'superadmin') menu = superAdminMenu;
    else if (user.role === 'campaign_admin') menu = campaignAdminMenu;
    else if (user.role === 'action_admin') menu = actionAdminMenu;
  }
  menu.push({ name: 'Mi Perfil', path: '/admin/profile', icon: <FaUserCog className="w-5 h-5" /> });

  // Links de interés antes de Colectivos Afines
  const groupDefinitions = [
    { label: 'Principal', keys: ['Dashboard'] },
    { label: 'Campañas y Comunicación', keys: [
        'Acciones', 'Campañas', 'BDS', 'Noticias', 'Blog/Reportes',
        'Firma Peticiones', 'Grupos de Chat', 'Links de interés', 'Colectivos Afines'
      ] },
    { label: 'Contenido y Datos', keys: ['Imágenes', 'Base de Datos'] },
    { label: 'Administración', keys: ['Administradores', 'Plantillas Email', 'Mi Perfil'] },
  ];

  const groupedMenu = groupDefinitions.map(group => ({
    label: group.label,
    items: menu.filter(item => group.keys.includes(item.name)),
  })).filter(group => group.items.length > 0);

  // *** CAMBIO A COLOR MÁS ALEGRE: amarillo clarito (bg-amber-50) ***
  const mainBgColor = 'bg-amber-50';

  if (!isClient || loading) {
    return (
      <div className={`min-h-screen ${mainBgColor} flex`}>
        <aside className="w-60 bg-white shadow-md flex flex-col">
          <div className="h-32 p-6 border-b border-gray-200 bg-white flex items-center justify-center">
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[1,2,3].map(i=><div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />)}
          </nav>
        </aside>
        <div className="flex-1 p-6">
          <div className="h-32 bg-gray-200 rounded animate-pulse mb-4" />
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

  return (
    <div className={`min-h-screen flex flex-col ${mainBgColor} overflow-x-hidden`}>
      <style jsx global>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 relative overflow-x-hidden">
        {/* SIDEBAR: altura completa (sin restricción inferior) */}
        <aside className={`fixed lg:fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          <div className="h-28 lg:h-32 bg-white border-b-4 border-[#009639] flex flex-col items-center justify-center">
            <img src="/logo.svg" alt="Logo" className="h-20 w-auto mb-1" />
            <p className="text-sm font-semibold text-gray-800 tracking-wide">
              Voces Palestinas por la Justicia
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 hide-scrollbar">
            {groupedMenu.map((group) => (
              <div key={group.label}>
                <h3 className="px-3 mb-2 text-[0.65rem] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</h3>
                <ul className="space-y-1">
                  {group.items.map(item => {
                    const isActive = router.pathname === item.path || router.pathname.startsWith(item.path + '/');
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all ${
                            isActive
                              ? 'bg-green-50 text-[#009639] shadow-sm font-semibold'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
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

        {/* CONTENIDO PRINCIPAL (solo con padding-top para el header) */}
        <div className="flex-1 flex flex-col w-full lg:pl-60 box-border h-screen lg:h-screen">
          {/* HEADER FIJO */}
          <header className="lg:fixed lg:top-0 lg:left-0 lg:right-0 lg:z-40 lg:pl-60 h-28 lg:h-32 bg-[#C62828] flex items-center justify-between px-4 lg:px-8 shadow-md after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[4px] after:bg-[#009639] box-border">
            <button className="lg:hidden text-white mr-4 p-2 -ml-2" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
              <FaBars className="w-6 h-6" />
            </button>

            <div className="hidden lg:flex items-end h-full flex-shrink-0 ml-4 lg:ml-6 w-1/5">
              <div className="bg-white border-2 border-[#009639] border-b-0 rounded-t-xl px-6 py-3 h-1/2 flex items-center shadow-md w-full">
                <h1 className="text-gray-800 text-3xl font-semibold leading-tight tracking-tight truncate">{title}</h1>
              </div>
            </div>

            <h1 className="lg:hidden text-white text-xl font-light truncate mr-auto">{title}</h1>

            <div className="flex items-center self-center gap-3 lg:gap-4 flex-shrink-0">
              <Link href="/" className="inline-flex items-center gap-2 text-sm lg:text-base font-medium text-gray-700 border-2 border-gray-300 bg-white/90 hover:bg-white px-4 lg:px-6 py-2 rounded-full transition-all shadow-sm">
                <span className="bg-white rounded-full w-7 h-7 flex items-center justify-center border border-gray-200">
                  <img src="/logo.svg" alt="Logo" className="h-5 w-auto" />
                </span>
                <span className="hidden sm:inline">Ir al sitio público</span>
                <FaArrowRight className="w-4 h-4 text-gray-600" />
              </Link>

              <div className="relative flex flex-col items-center">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 text-xs lg:text-sm font-medium text-red-700 border-2 border-red-300 bg-white/90 hover:bg-white px-2 lg:px-3 py-1 rounded-full transition-all shadow-sm"
                  title="Cerrar sesión"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
                <span className={`absolute top-full mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border border-black shadow ${roleColor(user.role)}`}>
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
            </div>
          </header>

          {/* Área desplazable que incluye main y footer */}
          <div className="flex-1 overflow-y-auto hide-scrollbar pt-28 lg:pt-32">
            <main className="p-4 lg:p-8 box-border">
              {children}
            </main>

            {/* FOOTER como parte del flujo, debajo del main */}
            <footer className="relative bg-white border-t border-gray-200 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-600 px-4">
              <div className="absolute top-0 left-0 right-0 flex h-0.5">
                <div className="flex-1 bg-[#E4312B]" />
                <div className="flex-1 bg-[#009639]" />
                <div className="flex-1 bg-black" />
              </div>

              <p className="flex items-center gap-1 text-left">
                <span className="text-base font-medium">@</span> {new Date().getFullYear()} Voces Palestinas por la Justicia
              </p>
              <Link
                href="/admin/help"
                className="mt-2 sm:mt-0 inline-flex items-center gap-1 text-gray-700 hover:text-[#009639] transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ayuda
              </Link>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}