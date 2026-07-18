// ============================================
// IMPORTS
// ============================================
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function Layout({ children, title = 'Voces Palestinas por la Justicia', bgClass = '' }) {
  const [showFlagPopup, setShowFlagPopup] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!showFlagPopup) return;
    const timer = setTimeout(() => setShowFlagPopup(false), 6000);
    return () => clearTimeout(timer);
  }, [showFlagPopup]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showFlagPopup) setShowFlagPopup(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFlagPopup]);

  // Detecta si estamos al final de la página para mostrar el botón de subir
  useEffect(() => {
    const handleScroll = () => {
      const hasOverflow = document.body.scrollHeight > window.innerHeight;
      const atBottom =
        window.scrollY + window.innerHeight >= document.body.scrollHeight - 100;
      setShowScrollTop(hasOverflow && atBottom);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFlagClick = useCallback(() => setShowFlagPopup(true), []);
  const closeFlagPopup = useCallback(() => setShowFlagPopup(false), []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
        />
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <script
            async
            defer
          />
        )}
      </Head>

      <div className="flex flex-col min-h-screen bg-stone-100">
        {/* HEADER con línea verde inferior y scroll horizontal oculto */}
        <header
          className="bg-white shadow-sm border-b-[6px] border-[#008000] w-full overflow-x-auto hide-scrollbar"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <div className="flex items-center justify-between px-4 py-5 min-w-max">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="relative h-[5.5rem] w-auto aspect-square">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* TÍTULO CON EL NUEVO COLOR #E30613 (rojo BDS) */}
              <span className="text-5xl text-[#E30613] hidden sm:inline leading-tight font-title">
                Voces Palestinas por la Justicia
              </span>
            </Link>

            {/* Menú de escritorio: siempre en una línea */}
            <nav className="hidden md:flex flex-nowrap space-x-6 justify-center flex-1 mx-4 min-w-max">
              <Link href="/campanas" className="text-gray-600 hover:text-[#E4312B] transition text-base font-medium py-1 whitespace-nowrap">Campañas</Link>
              <Link href="/bds" className="text-gray-600 hover:text-[#E4312B] transition text-base font-medium py-1 whitespace-nowrap">BDS</Link>
              <Link href="/acciones" className="text-gray-600 hover:text-[#E4312B] transition text-base font-medium py-1 whitespace-nowrap">Acciones</Link>
              <Link href="/peticiones" className="text-gray-600 hover:text-[#E4312B] transition text-base font-medium py-1 whitespace-nowrap">Firmar Peticiones</Link>
              <Link href="/grupos-chat" className="text-gray-600 hover:text-[#E4312B] transition text-base font-medium py-1 flex items-center gap-1 whitespace-nowrap">
                Grupos
                <span className="flex items-center gap-0.5 ml-1">
                  {/* WhatsApp */}
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {/* Telegram */}
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/></svg>
                  {/* Signal */}
                  <div className="relative w-4 h-4">
                    <Image
                      src="/assets/icons/Signal-Logo.svg"
                      alt="Signal"
                      fill
                      className="object-contain"
                    />
                  </div>
                </span>
              </Link>
              <Link href="/galeria" className="text-gray-600 hover:text-[#E4312B] transition text-base font-medium py-1 whitespace-nowrap">Galería</Link>
              <Link href="/reportes" className="text-gray-600 hover:text-[#E4312B] transition text-base font-medium py-1 whitespace-nowrap">Blog/Reportes</Link>
              <Link href="/noticias" className="text-gray-600 hover:text-[#E4312B] transition text-base font-medium py-1 whitespace-nowrap">Noticias</Link>
            </nav>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <a
                href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-600 hover:text-[#E4312B] transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              <Link
                href="/participa"
                className="hidden sm:inline-flex items-center justify-center border-2 border-green-600 text-green-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition w-28"
              >
                Participa
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/donaciones" className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-700 transition flex items-center justify-center gap-1 w-28">
                Dona <span>❤️</span>
              </Link>
              <Link href="/admin/login" className="text-gray-500 hover:text-[#E4312B] transition" aria-label="Admin login">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Menú MÓVIL: ahora con scroll horizontal, sin wrap */}
          <div className="md:hidden px-4 pb-3 flex flex-nowrap gap-2 overflow-x-auto hide-scrollbar">
            <Link href="/campanas" className="text-gray-600 hover:text-[#E4312B] text-base font-medium py-1 whitespace-nowrap">Campañas</Link>
            <Link href="/bds" className="text-gray-600 hover:text-[#E4312B] text-base font-medium py-1 whitespace-nowrap">BDS</Link>
            <Link href="/acciones" className="text-gray-600 hover:text-[#E4312B] text-base font-medium py-1 whitespace-nowrap">Acciones</Link>
            <Link href="/peticiones" className="text-gray-600 hover:text-[#E4312B] text-base font-medium py-1 whitespace-nowrap">Firmar Peticiones</Link>
            <Link href="/grupos-chat" className="text-gray-600 hover:text-[#E4312B] text-base font-medium py-1 flex items-center gap-1 whitespace-nowrap">
              Grupos
              <span className="flex gap-0.5">
                {/* WhatsApp */}
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {/* Telegram */}
                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/></svg>
                {/* Signal */}
                <div className="relative w-3 h-3">
                  <Image
                    src="/assets/icons/Signal-Logo.svg"
                    alt="Signal"
                    fill
                    className="object-contain"
                  />
                </div>
              </span>
            </Link>
            <Link href="/galeria" className="text-gray-600 hover:text-[#E4312B] text-base font-medium py-1 whitespace-nowrap">Galería</Link>
            <Link href="/reportes" className="text-gray-600 hover:text-[#E4312B] text-base font-medium py-1 whitespace-nowrap">Blog/Reportes</Link>
            <Link href="/noticias" className="text-gray-600 hover:text-[#E4312B] text-base font-medium py-1 whitespace-nowrap">Noticias</Link>
          </div>
        </header>

        <main className={`flex-1 ${bgClass || 'bg-[oklch(97.7%_0.014_308.299)]'}`}>
          {children}
        </main>

        {/* FOOTER con línea verde unida */}
        <footer className="bg-gray-800 text-white pt-10 pb-10 border-t-[6px] border-[#008000]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Suscríbete a nuestra Newsletter</h2>
              <p className="text-gray-300 mb-4">Recibe nuestras novedades y recordatorios directamente en tu correo.</p>
              <Link href="/subscribe" className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full transition">
                Suscríbete
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pt-8 border-t border-gray-700">
              <div className="flex justify-center md:justify-start">
                <button
                  onClick={handleFlagClick}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  aria-label="Mostrar mensaje de apoyo a Palestina"
                >
                  <div className="relative w-16 h-16">
                    <Image
                      src="/palestine-flag.png"
                      alt="Bandera de Palestina"
                      fill
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                </button>
              </div>
              <div className="flex flex-col items-center text-center">
                <Link href="/" aria-label="Ir al inicio">
                  <div className="relative w-36 h-36">
                    <Image
                      src="/logo.svg"
                      alt="Logo de Voces Palestinas por la Justicia"
                      fill
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                </Link>
                <p className="text-xs text-gray-400 mt-2">
                  &copy; {new Date().getFullYear()} Voces Palestinas por la Justicia<br />
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                <div className="text-sm space-y-1.5">
                  <h4 className="font-semibold text-gray-300 mb-2">Información</h4>
                  <Link href="/about" className="block hover:text-red-400 transition">Quiénes somos</Link>
                  <Link href="/contact" className="block hover:text-red-400 transition">Contacto</Link>
                  <Link href="/donaciones" className="block hover:text-red-400 transition">Transparencia financiera</Link>
                  <Link href="/privacidad" className="block hover:text-red-400 transition">Política de privacidad</Link>

                  <hr className="border-t border-[#008000] my-3" />
                  <Link href="/links" className="block hover:text-red-400 transition font-medium">
                    Links de interés
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {showFlagPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4"
          onClick={closeFlagPopup}
          role="dialog"
          aria-modal="true"
          aria-labelledby="flag-popup-title"
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="flag-popup-title"
              className="text-gray-700 text-xl font-medium leading-relaxed"
            >
              Desde el río hasta el mar Palestina vencerá. Esta web ha sido creada desde un corazón que late con nuestra Humanidad. Para recordar y nunca olvidar a cada una de las victimas del genocidio en Palestina: personal sanitario, educativo, periodistas, trabajador@s sociales, familias y amores que nunca podrán ser...🍉 Con especial mención a Yousef Abu Rabee que fué asesinado mientras cultivaba y cuidaba a la tierra y Rifaat Radwan quien fue asesinado tratando de salvar vidas...
            </p>
          </div>
        </div>
      )}

      {/* Botón Volver arriba */}
      <button
        onClick={scrollToTop}
        aria-label="Volver arriba"
        className={`fixed bottom-8 right-8 z-40 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Estilo para ocultar la barra de desplazamiento en el header */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE y Edge */
          scrollbar-width: none;     /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;             /* Chrome, Safari y Opera */
        }
      `}</style>
    </>
  );
}