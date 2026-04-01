import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { translateText } from '../lib/translate';

export default function Layout({ children, title = 'LunaRoja' }) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState('es');
  const [translating, setTranslating] = useState(false);
  const observerRef = useRef(null);
  const isTranslatingRef = useRef(false);
  const translatedNodes = useRef(new WeakSet());

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: 'ar' },
  ];

  // Traduce un nodo de texto individual
  const translateNode = async (node, targetLang) => {
    if (translatedNodes.current.has(node)) return;
    const original = node.textContent;
    if (!original.trim()) return;
    try {
      const translated = await translateText(original, 'es', targetLang);
      if (translated && translated !== original) {
        node.textContent = translated;
        translatedNodes.current.add(node);
      }
    } catch (err) {
      console.error('Error translating node:', err);
    }
  };

  // Traduce todos los nodos de texto actuales
  const translateAllNodes = async (targetLang) => {
    if (isTranslatingRef.current) return;
    isTranslatingRef.current = true;
    setTranslating(true);
    console.log(`🌐 Translating page to ${targetLang}...`);

    try {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Saltar si algún ancestro tiene clase 'notranslate'
            if (node.parentElement?.closest?.('.notranslate')) return NodeFilter.FILTER_REJECT;
            if (node.parentElement?.tagName === 'SCRIPT' || node.parentElement?.tagName === 'STYLE')
              return NodeFilter.FILTER_REJECT;
            if (node.textContent?.trim().length === 0) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      console.log(`Found ${textNodes.length} text nodes.`);

      const batchSize = 5;
      for (let i = 0; i < textNodes.length; i += batchSize) {
        const batch = textNodes.slice(i, i + batchSize);
        await Promise.all(batch.map(node => translateNode(node, targetLang)));
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      console.log(`Translation to ${targetLang} completed.`);
    } catch (error) {
      console.error('Global translation error:', error);
    } finally {
      setTranslating(false);
      isTranslatingRef.current = false;
    }
  };

  // Configurar MutationObserver para contenido dinámico
  const setupObserver = (targetLang) => {
    if (observerRef.current) observerRef.current.disconnect();

    let timeoutId = null;
    const observer = new MutationObserver((mutations) => {
      if (isTranslatingRef.current) return;

      const newTextNodes = [];
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !translatedNodes.current.has(node)) {
            newTextNodes.push(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
              acceptNode: (n) => n.textContent?.trim() && !translatedNodes.current.has(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            });
            let textNode;
            while (textNode = walker.nextNode()) {
              newTextNodes.push(textNode);
            }
          }
        });
      });

      if (newTextNodes.length === 0) return;

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log(`Detected ${newTextNodes.length} new nodes, translating...`);
        newTextNodes.forEach(node => translateNode(node, targetLang));
        timeoutId = null;
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    observerRef.current = observer;
  };

  const changeLanguage = async (lang) => {
    if (lang === currentLang) return;
    setCurrentLang(lang);
    localStorage.setItem('preferred_lang', lang);
    setShowLangMenu(false);

    if (lang === 'es') {
      window.location.reload();
      return;
    }

    translatedNodes.current = new WeakSet();
    await translateAllNodes(lang);
    setupObserver(lang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('preferred_lang');
    if (savedLang && savedLang !== 'es') {
      changeLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.lang-selector')) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3c1.5 1.5 2.5 4 2.5 9s-1 7.5-2.5 9m0-18c-1.5 1.5-2.5 4-2.5 9s1 7.5 2.5 9" />
    </svg>
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header className="bg-white shadow-sm w-full">
        <div className="flex items-center w-full px-0 py-3">
          <div className="flex-shrink-0 ml-4">
            <Link href="/admin/login" className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          <div className="flex-1 flex justify-start pl-8">
            <Link href="/" className="text-2xl font-bold text-red-700 notranslate">LunaRoja</Link>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-6 pr-4">
            <div className="hidden md:flex space-x-6">
              <Link href="/campanas" className="hover:text-red-700">Campañas</Link>
              <Link href="/acciones" className="hover:text-red-700">Acciones</Link>
              <Link href="/chatsGroups" className="hover:text-red-700">Grupos de Chat</Link>
              <Link href="/noticias" className="hover:text-red-700">Noticias</Link>
              <Link href="/reports" className="hover:text-red-700">Reportes</Link>
              <Link href="/instagram" className="hover:text-red-700">Instagram</Link>
            </div>

            {/* Selector de idioma – añadimos notranslate para que no se traduzca */}
            <div className="lang-selector relative notranslate">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-1 text-gray-700 hover:text-red-700 focus:outline-none"
                disabled={translating}
              >
                {translating ? (
                  <svg className="animate-spin h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <GlobeIcon />
                )}
                <span>{languages.find(l => l.code === currentLang)?.flag}</span>
                <span>{languages.find(l => l.code === currentLang)?.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="mr-2">{lang.flag}</span> {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="md:hidden px-4 pb-3 flex flex-wrap gap-2 justify-center">
          <Link href="/campanas" className="text-sm hover:text-red-700">Campañas</Link>
          <Link href="/acciones" className="text-sm hover:text-red-700">Acciones</Link>
          <Link href="/chatsGroups" className="text-sm hover:text-red-700">Grupos de Chat</Link>
          <Link href="/noticias" className="text-sm hover:text-red-700">Noticias</Link>
          <Link href="/reports" className="text-sm hover:text-red-700">Reportes</Link>
          <Link href="/instagram" className="text-sm hover:text-red-700">Instagram</Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          {/* Pie de página sin notranslate para que se traduzca */}
          <p>&copy; {new Date().getFullYear()} LunaRoja. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}