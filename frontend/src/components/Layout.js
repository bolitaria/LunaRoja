import Link from 'next/link';
import Head from 'next/head';

export default function Layout({ children, title = 'LunaRoja' }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-red-700">LunaRoja</Link>
          <div className="flex items-center space-x-6">
            <Link href="/videos" className="hover:text-red-700">Videos</Link>
            <Link href="/reports" className="hover:text-red-700">Reportes</Link>
            <Link href="/acciones" className="hover:text-red-700">Acciones</Link>
            <Link href="/campanas" className="hover:text-red-700">Campañas</Link>
            <Link href="/grupos" className="hover:text-red-700">Grupos</Link>
            <Link href="/instagram" className="hover:text-red-700">Instagram</Link>
            <Link href="/about" className="hover:text-red-700">Acerca de</Link>
            <Link href="/contact" className="hover:text-red-700">Contacto</Link>
            <Link href="/admin/login" className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} LunaRoja. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}