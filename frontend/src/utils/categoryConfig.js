// utils/categoryConstants.js

// Paleta vibrante, una por categoría, con texto unificado legible (#1a1a1a)
// Cada fondo es distinto, borde más oscuro que el fondo, sin grises tristes.

export const categoryLabels = {
  // Formación / Educación
  webinar: 'Webinar',
  talk: 'Charla',
  workshop: 'Talleres',
  teach_in: 'Charla Formativa',

  // Protesta / Acción Directa
  protest: 'Concentración',
  strike: 'Huelga',
  march: 'Marcha',
  performance: 'Performance',
  bds: 'Acción BDS',

  // Comunidad / Solidaridad
  solidarity_action: 'Acción Solidaria',
  vigil: 'Vigilia',
  assembly: 'Asamblea',
  digital_campaign: 'Campaña Digital'
};

export const categoryStyles = {
  // ─── Formación ───────────────────────────────
  webinar: {
    backgroundColor: '#D4FCD4', // verde primavera brillante
    color: '#1a1a1a',           // texto unificado
    borderColor: '#2D8A2D'      // verde oscuro
  },
  talk: {
    backgroundColor: '#FFF3B0', // amarillo dorado vivo
    color: '#1a1a1a',
    borderColor: '#B5850B'      // dorado tostado
  },
  workshop: {
    backgroundColor: '#E2F7AE', // verde lima chispeante
    color: '#1a1a1a',
    borderColor: '#5A8000'      // verde oliva intenso
  },
  teach_in: {
    backgroundColor: '#FFE680', // amarillo sol radiante
    color: '#1a1a1a',
    borderColor: '#B87800'      // ámbar profundo
  },

  // ─── Protesta / Acción Directa ───────────────
  protest: {
    backgroundColor: '#FFB3B3', // rojo coral pálido
    color: '#1a1a1a',
    borderColor: '#CC0000'      // rojo protesta
  },
  strike: {
    backgroundColor: '#FFD9B3', // naranja melocotón
    color: '#1a1a1a',
    borderColor: '#E65C00'      // naranja quemado
  },
  march: {
    backgroundColor: '#FFCCE6', // fucsia clarito
    color: '#1a1a1a',
    borderColor: '#CC0066'      // rosa intenso
  },
  performance: {
    backgroundColor: '#E6CCFF', // lila brillante
    color: '#1a1a1a',
    borderColor: '#7B00CC'      // púrpura eléctrico
  },
  bds: {
    backgroundColor: '#FF9999', // rojo BDS (movimiento)
    color: '#1a1a1a',
    borderColor: '#990000'      // rojo oscuro liberación
  },

  // ─── Comunidad / Solidaridad ─────────────────
  solidarity_action: {
    backgroundColor: '#DDD6FE', // violeta suave pero alegre
    color: '#1a1a1a',
    borderColor: '#5B21B6'      // violeta intenso
  },
  vigil: {
    backgroundColor: '#FFD8B1', // cálido melocotón claro
    color: '#1a1a1a',
    borderColor: '#CC5500'      // naranja tierra
  },
  assembly: {
    backgroundColor: '#FFE0A3', // dorado asambleario
    color: '#1a1a1a',
    borderColor: '#B87300'      // ámbar oscuro
  },
  digital_campaign: {
    backgroundColor: '#FFB3D9', // rosa mexicano claro
    color: '#1a1a1a',
    borderColor: '#CC0066'      // rosa fuerte
  }
};