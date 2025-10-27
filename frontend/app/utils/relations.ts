// Utilidad para normalizar la extracción de ids de relaciones desde objetos
// de la API que pueden representarlas en varias formas: { keyId },
// { key: { id } }, { key: id } o variantes en snake_case. Devuelve number|null.
export function getRelationId(obj: any, key: string): number | null {
  if (!obj) return null;
  try {
    // direct explicit id field e.g. entidadId
    const explicit = obj[`${key}Id`];
    if (explicit !== undefined && explicit !== null) return Number(explicit);

    // direct value e.g. entidad: 3
    const direct = obj[key];
    if (direct !== undefined && direct !== null) {
      if (typeof direct === 'object') {
        if (direct.id !== undefined && direct.id !== null)
          return Number(direct.id);
      } else if (typeof direct === 'number' || typeof direct === 'string') {
        const n = Number(direct);
        if (!Number.isNaN(n)) return n;
      }
    }

    // camelCase to snake_case fallback
    const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const sVal = obj[snake];
    if (sVal !== undefined && sVal !== null) {
      if (typeof sVal === 'object') {
        if (sVal.id !== undefined && sVal.id !== null) return Number(sVal.id);
      } else if (typeof sVal === 'number' || typeof sVal === 'string') {
        const n = Number(sVal);
        if (!Number.isNaN(n)) return n;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}
