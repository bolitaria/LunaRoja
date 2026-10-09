/**
 * Utilidades para descargar imágenes en JPG o PNG.
 */

/**
 * Convierte un blob de imagen a JPG o PNG usando canvas.
 */
async function convertImageBlob(blob, format) {
  const needsConversion =
    (format === 'image/png' && blob.type !== 'image/png') ||
    (format === 'image/jpeg' && !['image/jpeg', 'image/jpg'].includes(blob.type));

  if (!needsConversion) return blob;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const objUrl = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objUrl);
      canvas.toBlob(
        (out) => (out ? resolve(out) : reject(new Error('toBlob falló'))),
        format,
        format === 'image/jpeg' ? 0.92 : undefined
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('No se pudo cargar la imagen'));
    };
    img.src = objUrl;
  });
}

/**
 * Descarga una imagen desde su URL en el formato indicado.
 * @param {string} url
 * @param {string} filename sin extensión
 * @param {'jpg'|'png'} format
 */
export async function downloadImage(url, filename, format = 'jpg') {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const converted = await convertImageBlob(blob, mime);

  const { saveAs } = await import('file-saver');
  const ext = format === 'png' ? 'png' : 'jpg';
  const safe = (filename || 'imagen').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  saveAs(converted, `${safe}.${ext}`);
}

/**
 * Descarga varias imágenes en un ZIP.
 * @param {Array<{url:string, filename:string}>} items
 * @param {string} zipName sin extensión
 * @param {'jpg'|'png'} format
 */
export async function downloadImagesAsZip(items, zipName = 'imagenes', format = 'jpg') {
  const JSZip = (await import('jszip')).default;
  const { saveAs } = await import('file-saver');
  const zip = new JSZip();
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const res = await fetch(item.url, { mode: 'cors' });
      if (!res.ok) continue;
      const blob = await res.blob();
      const converted = await convertImageBlob(blob, mime);
      const name = (item.filename || `img_${i + 1}`).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
      zip.file(`${name}.${ext}`, converted);
    } catch (e) {
      console.warn('Fallo descargando', item.url, e);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${zipName}_${Date.now()}.zip`);
}
