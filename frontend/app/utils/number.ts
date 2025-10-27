// Funciones auxiliares para normalizar y validar entradas decimales para el backend
// (precisión 15, escala 2)
export function normalizeDecimalInput(
  input?: string | number | null,
): string | null {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;
  // Remove spaces
  s = s.replace(/\s+/g, '');
  // Handle thousands/decimal separators heuristically
  if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
    // if comma occurs after last dot, assume European (1.234,56)
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // US style 1,234.56 -> remove commas
      s = s.replace(/,/g, '');
    }
  } else if (s.indexOf(',') !== -1) {
    // only comma present: treat as decimal separator
    s = s.replace(/,/g, '.');
  } else if (s.indexOf('.') !== -1 && s.indexOf(',') === -1) {
    // only dots present: assume they are thousands separators, remove them
    s = s.replace(/\./g, '');
  }
  // remove any non-digit except dot and leading minus
  s = s.replace(/(?!^-)[^0-9.]/g, '');
  // ensure only one dot
  const parts = s.split('.');
  if (parts.length > 2) {
    // join extras as decimals
    s = parts.shift()! + '.' + parts.join('');
  }
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  // Format with exactly 2 decimals
  const out = n.toFixed(2);
  // final basic sanity: length <= 32
  if (out.length > 32) return null;
  return out;
}

export function validateDecimalPrecision(
  formatted: string | null,
  precision = 15,
  scale = 2,
): boolean {
  if (formatted == null) return true; // nothing to validate
  // formatted is like '12345.67'
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
  // Remove all characters except digits and comma
  s = s.replace(/[^0-9,]/g, '');
  // If more than one comma, keep first and remove rest
  const parts = s.split(',');
  const intPart = parts.shift() || '';
  // allow trailing comma with zero decimals while typing
  const decPartRaw = parts.join('');
  const decPart = decPartRaw.slice(0, 2); // max 2 decimals
  // format integer part with dots
  const intFormatted = intPart
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // if user typed a comma but no decimals yet, preserve the comma
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
  // Show two decimals
  return n.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
