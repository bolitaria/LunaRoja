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
    { name: 'Instagram', path: '/admin/instagram' },
    { name: 'Campañas', path: '/admin/campaigns' },
    { name: 'Acciones', path: '/admin/actions' },
    { name: 'Imágenes', path: '/admin/images' },
    { name: 'Videos', path: '/admin/videos' },
    { name: 'Reportes', path: '/admin/reports' },
    { name: 'Grupos WhatsApp/Telegram', path: '/admin/groups' },
    { name: 'Suscriptores', path: '/admin/subscribers' },
  ];

  const campaignAdminMenu = [
    { name: 'Campañas', path: '/admin/campaigns' },
    { name: 'Acciones', path: '/admin/actions' },
    { name: 'Imágenes', path: '/admin/images' },
    { name: 'Videos', path: '/admin/videos' },
    { name: 'Grupos WhatsApp/Telegram', path: '/admin/groups' },
  ];

  const actionAdminMenu = [
    { name: 'Acciones', path: '/admin/actions' },
    { name: 'Imágenes', path: '/admin/images' },
    { name: 'Videos', path: '/admin/videos' },
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

  // Añadir "Mi Perfil" al final del menú (debe existir la página /admin/profile)
  const profileItem = { name: 'Mi Perfil', path: '/admin/profile' };
  menu.push(profileItem);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/admin" className="text-xl font-bold">LunaRoja Admin</Link>
          <div className="flex items-center space-x-4">
            <span>
              {user?.username} (
              {user?.role === 'superadmin' ? 'Superadmin' : 
               user?.role === 'campaign_admin' ? 'Admin Campaña' : 
               user?.role === 'action_admin' ? 'Admin Evento' : ''})
            </span>
            <button onClick={logout} className="bg-red-800 px-3 py-1 rounded hover:bg-red-900">
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>
      <div className="flex">
        <aside className="w-64 bg-white shadow-md h-screen">
          <ul className="py-4">
            {menu.map(item => (
              <li key={item.path}>
                <Link href={item.path} className={`block px-4 py-2 hover:bg-gray-200 ${router.pathname === item.path ? 'bg-gray-200 font-semibold' : ''}`}>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}