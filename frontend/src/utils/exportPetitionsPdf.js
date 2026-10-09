/**
 * Exporta peticiones a PDF.
 * Cada petición se renderiza tal cual se ve en la vista pública (PetitionPreview)
 * y se añade como una página del PDF.
 *
 * Uso:
 *   import { exportPetitionsToPDF } from '../../../utils/exportPetitionsPdf';
 *   await exportPetitionsToPDF(petitions, 'peticiones.pdf');
 */

const A4_WIDTH_PX = 794;   // 96 dpi
const A4_HEIGHT_PX = 1123;

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return ''; }
}

/**
 * Genera el markup estático de una petición, clon visual de PetitionPreview.
 * Estilos inline para que html2canvas los capture sin depender de Tailwind.
 */
function renderPetitionHTML(p) {
  const isExternal = p.type === 'official' || p.type === 'external';
  const image = p.featured_image || p.imageUrl || '';
  const title = esc(p.title || '');
  const description = esc(p.description || '');
  const content = esc(p.content || '');
  const externalUrl = esc(p.external_url || '');
  const signatures = p.total_signatures || 0;

  const imageBlock = image
    ? `<div style="width:100%;height:220px;background:#f3f4f6;overflow:hidden;display:flex;align-items:center;justify-content:center;">
         <img src="${esc(image)}" crossorigin="anonymous" style="max-width:100%;max-height:100%;object-fit:cover;" />
       </div>`
    : '';

  const badge = isExternal
    ? `<span style="display:inline-block;background:#dbeafe;color:#1e40af;font-size:11px;font-weight:700;padding:4px 10px;border-radius:9999px;border:1px solid #93c5fd;">🌐 Petición Externa</span>`
    : `<span style="display:inline-block;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:4px 10px;border-radius:9999px;border:1px solid #86efac;">✍️ Petición Interna</span>`;

  const urgencyBadge = p.urgency
    ? `<span style="display:inline-block;background:#fee2e2;color:#991b1b;font-size:11px;font-weight:700;padding:4px 10px;border-radius:9999px;margin-left:6px;">🔥 Urgente</span>`
    : '';

  const bodyBlock = isExternal
    ? `<p style="color:#6b7280;font-size:13px;margin:8px 0 0;">Esta petición se encuentra alojada en una plataforma externa.</p>
       ${externalUrl ? `<p style="color:#9ca3af;font-size:11px;word-break:break-all;margin-top:8px;">${externalUrl}</p>` : ''}
       <div style="margin-top:20px;">
         <span style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;padding:10px 24px;border-radius:12px;font-size:14px;">Ir a la petición oficial</span>
       </div>`
    : `<div style="color:#374151;font-size:14px;line-height:1.7;margin-top:12px;">${content || description}</div>
       <div style="margin-top:24px;padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;">
         <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">${signatures} firma${signatures === 1 ? '' : 's'} conseguida${signatures === 1 ? '' : 's'}</p>
       </div>`;

  return `
    <div style="
      width: ${A4_WIDTH_PX}px;
      min-height: ${A4_HEIGHT_PX}px;
      background: #fff;
      padding: 40px 50px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    ">
      <article style="
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        overflow: hidden;
        max-width: 700px;
        margin: 0 auto;
      ">
        ${imageBlock}
        <div style="padding: 32px 28px; text-align: center;">
          ${badge}${urgencyBadge}
          <h1 style="font-size:24px;font-weight:700;color:#1f2937;margin:16px 0 8px;line-height:1.3;">${title}</h1>
          ${description && !isExternal ? `<p style="color:#6b7280;font-size:13px;margin:0 0 8px;">${description}</p>` : ''}
          ${bodyBlock}
        </div>
      </article>
      <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:24px;">
        Voces Palestinas por la Justicia · ${formatDate(p.created_at || p.createdAt)}
      </p>
    </div>
  `;
}

export async function exportPetitionsToPDF(petitions, filename = 'peticiones.pdf') {
  if (!petitions || petitions.length === 0) {
    throw new Error('No hay peticiones para exportar');
  }

  const { default: jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // Contenedor temporal fuera de pantalla
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < petitions.length; i++) {
      const p = petitions[i];
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderPetitionHTML(p);
      const pageEl = wrapper.firstElementChild;
      container.appendChild(pageEl);

      // Esperar imágenes
      const imgs = pageEl.querySelectorAll('img');
      await Promise.all(
        Array.from(imgs).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              img.onload = resolve;
              img.onerror = resolve;
            })
        )
      );

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));

      // Limpiar
      container.removeChild(pageEl);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
