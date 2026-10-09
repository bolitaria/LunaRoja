/**
 * Regiones del mundo para links de interés.
 * Se aplican solo cuando la categoría es 'internacional'.
 * Nombres neutrales (sin "Medio Oriente", "Tercer Mundo", etc.).
 */
export const LINK_REGIONS = [
  { key: 'norteamerica', label: 'Norteamérica' },
  { key: 'america_latina', label: 'América Latina y el Caribe' },
  { key: 'africa', label: 'África' },
  { key: 'asia_occidental', label: 'Asia Occidental' },
  { key: 'asia_meridional_oriental', label: 'Asia Meridional y Oriental' },
  { key: 'oceania', label: 'Oceanía' },
];

export const LINK_REGION_LABELS = LINK_REGIONS.reduce(
  (acc, r) => ({ ...acc, [r.key]: r.label }),
  { sin_region: 'Sin región' }
);
