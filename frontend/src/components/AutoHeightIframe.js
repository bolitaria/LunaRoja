// frontend/src/components/AutoHeightIframe.js
// Iframe que se ajusta automáticamente a la altura real del contenido.
// Se usa para previsualizar emails (misma-origen, así que contentDocument es accesible).
//
// Props:
//   - src: URL del iframe
//   - title: aria-label
//   - minHeight (default 300)
//   - maxHeight (default 1400)
//   - className: clases extra

import { useEffect, useRef, useState } from 'react';

export default function AutoHeightIframe({
  src,
  title = '',
  minHeight = 300,
  maxHeight = 1400,
  className = '',
}) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let observer = null;

    const adjust = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc || !doc.body) return;
        const rawHeight = Math.max(
          doc.body.scrollHeight,
          doc.documentElement?.scrollHeight || 0,
          doc.body.offsetHeight || 0
        );
        setHeight(Math.min(Math.max(rawHeight, minHeight), maxHeight));
      } catch {
        /* cross-origin o doc no listo: dejar la altura actual */
      }
    };

    const handleLoad = () => {
      adjust();
      // Observar cambios internos: imágenes que cargan, contenido dinámico
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body && typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(adjust);
          observer.observe(doc.body);
        }
      } catch {
        /* ignore */
      }
      // Segundo intento tras un tick (imágenes)
      setTimeout(adjust, 200);
      setTimeout(adjust, 800);
    };

    iframe.addEventListener('load', handleLoad);
    if (iframe.contentDocument?.readyState === 'complete') handleLoad();

    return () => {
      iframe.removeEventListener('load', handleLoad);
      if (observer) observer.disconnect();
    };
  }, [src, minHeight, maxHeight]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      scrolling="no"
      className={className}
      style={{
        width: '100%',
        height: `${height}px`,
        border: 0,
        display: 'block',
        transition: 'height 0.15s ease-out',
      }}
    />
  );
}
