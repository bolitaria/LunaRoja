/**
 * Clasifica una región en una categoría basada en palabras clave.
 * @param {string} region - Texto de la región (ej. "Málaga, España")
 * @returns {string} - Categoría: internacional, europeo, nacional, autonomico, regional, municipal, vecinal, otro
 */
function classifyRegion(region) {
  if (!region) return 'otro';

  const lower = region.toLowerCase();

  // Palabras clave para cada categoría (puedes ampliarlas)
  const keywords = {
    internacional: ['internacional', 'global', 'mundial', 'mundo', 'latinoamérica', 'latam', 'África', 'asia', 'américa', 'internation'],
    europeo: ['europa', 'europeo', 'europea', 'ue', 'unión europea'],
    nacional: ['nacional', 'país', 'españa', 'méxico', 'argentina', 'colombia', 'chile', 'perú', 'estado'],
    autonomico: ['autonómico', 'andaluz', 'andaluza', 'catalán', 'catalana', 'gallego', 'gallega', 'valenciano', 'madrileño', 'comunidad'],
    regional: ['regional', 'provincia', 'comarca', 'costa', 'sierra'],
    municipal: ['municipal', 'ciudad', 'municipio', 'local', 'ayuntamiento', 'concejo', 'distrito', 'barrio'],
    vecinal: ['vecinal', 'vecinos', 'asociación de vecinos', 'comunidad de vecinos', 'barrio pequeño']
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => lower.includes(word))) {
      return category;
    }
  }

  // Si contiene nombres de ciudades conocidas, asignar municipal (opcional)
  const ciudades = ['madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'málaga', 'zaragoza', 'murcia'];
  if (ciudades.some(c => lower.includes(c))) {
    return 'municipal';
  }

  return 'otro';
}

module.exports = classifyRegion;