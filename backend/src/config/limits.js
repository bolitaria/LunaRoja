/**
 * ============================================================
 * LÍMITES DE LA APLICACIÓN
 * ============================================================
 *
 * Este archivo centraliza TODOS los límites editables sin tocar código.
 * Los valores se exponen vía GET /api/config/limits al frontend, así que
 * cambiarlos aquí es suficiente para que la UI también los respete.
 *
 * Para cambiar un límite: edita el número y reinicia el backend.
 * (En producción: `docker compose up -d --force-recreate backend worker`)
 */

module.exports = {
  // ────────────────────────────────────────────────────────────
  // DOCUMENTOS (PDFs, DOCX, XLSX…)
  // ────────────────────────────────────────────────────────────
  documents: {
    // Máximo de documentos SUBIDOS con visibilidad pública por entidad
    maxPublicUploadsPerEntity: 5,

    // Máximo de documentos SUBIDOS con visibilidad admin por entidad
    maxAdminUploadsPerEntity: 5,

    // Máximo de enlaces externos (Drive, etc.) por entidad
    // Siempre son visibility='admin' (nunca públicos)
    maxExternalLinksPerEntity: 1,

    // Máximo de documentos por REPORTE (upload o link, mezclados)
    maxPerReport: 1,

    // Tamaño máximo por fichero en bytes
    maxFileSizeBytes: 20 * 1024 * 1024, // 20 MB

    // Extensiones permitidas para upload de documentos
    allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],

    // MIME types permitidos (debe corresponder con las extensiones de arriba)
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ],
  },

  // ────────────────────────────────────────────────────────────
  // IMÁGENES (featured, galería, logos, miniaturas)
  // ────────────────────────────────────────────────────────────
  images: {
    // Máximo de imágenes destacadas (featured) por entidad
    maxFeaturedPerEntity: 1,

    // Máximo de imágenes de galería por acción
    maxGalleryPerAction: 20,

    // Tamaño máximo por imagen en bytes
    maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB

    // MIME types permitidos
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

    // ─── Optimización ───
    // Si `optimize: true`, las imágenes subidas se procesan en el worker:
    //   - se convierten a WebP (calidad 85)
    //   - se redimensionan a máx `maxWidthPx` x `maxHeightPx`
    //   - GIFs animados se excluyen automáticamente
    optimize: true,
    maxWidthPx: 1920,
    maxHeightPx: 1920,
    webpQuality: 85, // 0-100
  },

  // ────────────────────────────────────────────────────────────
  // REPORTS (blog + report)
  // ────────────────────────────────────────────────────────────
  reports: {
    // Máximo de entradas en la bibliografía (solo type='report')
    // Cada entrada = { url (obligatoria), source (opcional) }
    maxBibliographyEntries: 5,

    // Máximo de documentos adjuntos por reporte (upload o link, mezclados)
    maxDocumentsPerReport: 1,
  },

  // ────────────────────────────────────────────────────────────
  // ENTIDADES SOPORTADAS
  // ────────────────────────────────────────────────────────────
  entities: {
    // Tipos de entidad que pueden tener documentos asociados
    documentables: ['action', 'campaign', 'bds', 'report'],
  },
};
