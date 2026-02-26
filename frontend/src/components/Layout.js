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
          <div className="space-x-6">
            <Link href="/videos" className="hover:text-red-700">Videos</Link>
            <Link href="/reports" className="hover:text-red-700">Reportes</Link>
            <Link href="/campanas" className="hover:text-red-700">Campañas</Link>
            <Link href="/acciones" className="hover:text-red-700">Acciones</Link>
            <Link href="/grupos" className="hover:text-red-700">Grupos</Link>
            <Link href="/about" className="hover:text-red-700">Acerca de</Link>
            <Link href="/contact" className="hover:text-red-700">Contacto</Link>
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
