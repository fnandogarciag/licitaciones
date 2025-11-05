/**
 * Funciones auxiliares para normalizar y validar entradas decimales para el backend.
 * Las restricciones de la base de datos son:
 * - Precisión total: 15 dígitos
 * - Escala (decimales): 2 dígitos
 * - Formato: punto como separador decimal
 */
export function normalizeDecimalInput(
  input?: string | number | null,
): string | null {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;
  // Eliminar espacios
  s = s.replace(/\s+/g, '');
  // Manejar separadores de miles y decimales de forma heurística
  if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
    // Si la coma aparece después del último punto, asumir formato europeo (1.234,56)
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // Formato estadounidense 1,234.56 -> eliminar comas
      s = s.replace(/,/g, '');
    }
  } else if (s.indexOf(',') !== -1) {
    // Solo hay coma: tratarla como separador decimal
    s = s.replace(/,/g, '.');
  } else if (s.indexOf('.') !== -1 && s.indexOf(',') === -1) {
    // Solo hay puntos: asumirlos como separadores de miles y eliminarlos
    s = s.replace(/\./g, '');
  }
  // Eliminar cualquier carácter que no sea dígito, excepto punto y signo menos al inicio
  s = s.replace(/(?!^-)[^0-9.]/g, '');
  // Asegurar que solo haya un punto decimal
  const parts = s.split('.');
  if (parts.length > 2) {
    // Unir partes extras como decimales
    s = parts.shift()! + '.' + parts.join('');
  }
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  // Formatear con exactamente 2 decimales
  const out = n.toFixed(2);
  // Validación básica final: longitud <= 32
  if (out.length > 32) return null;
  return out;
}

export function validateDecimalPrecision(
  formatted: string | null,
  precision = 15,
  scale = 2,
): boolean {
  if (formatted == null) return true; // No hay nada que validar
  // El formato esperado es como '12345.67'
  const m = formatted.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!m) return false;
  const intPart = m[2] || '';
  const fracPart = m[3] || '';
  if (intPart.length + fracPart.length > precision) return false;
  if (fracPart.length > scale) return false;
  return true;
}

export function formatThousands(val?: string): string {
  if (val == null) return '';
  const s = String(val);
  return s.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formatea la entrada permitiendo coma como separador decimal (máx 2 decimales)
 * y puntos como separadores de miles.
 * - Elimina los puntos que el usuario pueda teclear (usamos puntos sólo como separador de miles)
 * - Permite una sola coma para decimales, con hasta 2 dígitos después de la coma
 */
export function formatWithCommaDecimal(val?: string): string {
  if (val == null) return '';
  let s = String(val);
  // Eliminar todos los caracteres excepto dígitos y coma
  s = s.replace(/[^0-9,]/g, '');
  // Si hay más de una coma, mantener la primera y eliminar el resto
  const parts = s.split(',');
  const intPart = parts.shift() || '';
  // Permitir coma al final sin decimales mientras se escribe
  const decPartRaw = parts.join('');
  const decPart = decPartRaw.slice(0, 2); // máximo 2 decimales
  // Formatear parte entera con puntos como separadores de miles
  const intFormatted = intPart
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // Si el usuario escribió una coma pero aún no hay decimales, preservar la coma
  if (decPartRaw.length > 0) return `${intFormatted},${decPart}`;
  if (s.indexOf(',') !== -1) return `${intFormatted},`;
  return intFormatted;
}

/**
 * Formatea un valor numérico para mostrar con separadores de miles (.) y coma decimal.
 * Acepta números o cadenas numéricas. Devuelve '-' para null/undefined/inválido.
 */
export function formatForDisplay(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return '-';
  const n =
    typeof value === 'number'
      ? value
      : Number(
          String(value)
            .replace(/\s+/g, '')
            .replace(/\./g, '')
            .replace(/,/g, '.'),
        );
  if (Number.isNaN(n)) return '-';
  // Mostrar siempre dos decimales
  return n.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
