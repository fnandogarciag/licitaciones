/**
 * Utilidad para normalizar la extracción de IDs de relaciones desde objetos de la API.
 * Maneja múltiples formatos de respuesta:
 * 1. Campo ID explícito: { entidadId: 1 }
 * 2. Objeto anidado: { entidad: { id: 1 } }
 * 3. ID directo: { entidad: 1 }
 * 4. Variantes en snake_case: { entidad_id: 1 }
 *
 * @param obj Objeto que contiene la relación
 * @param key Nombre de la relación (ej: "entidad")
 * @returns ID numérico de la relación o null si no se encuentra
 */
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
