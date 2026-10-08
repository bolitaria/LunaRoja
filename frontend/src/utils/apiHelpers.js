/**
 * Normaliza la respuesta de endpoints paginados.
 * Acepta arrays planos o el envelope { data, total, page, limit, metrics }.
 */
export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

/**
 * Devuelve el envelope paginado completo o uno "vacío".
 */
export function unwrapPaginated(payload) {
  if (Array.isArray(payload)) {
    return { data: payload, total: payload.length, page: 1, limit: payload.length, metrics: {} };
  }
  if (payload && typeof payload === 'object') {
    return {
      data: Array.isArray(payload.data) ? payload.data : [],
      total: payload.total ?? 0,
      page: payload.page ?? 1,
      limit: payload.limit ?? 12,
      metrics: payload.metrics ?? {},
    };
  }
  return { data: [], total: 0, page: 1, limit: 12, metrics: {} };
}
