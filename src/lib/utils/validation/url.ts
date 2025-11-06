export function extractCodigoFromUrl(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (raw === '') return null;
  // Intentar parsear como URL. Si falta el esquema, intentar añadir https://
  let url: URL | null = null;
  try {
    url = new URL(raw);
  } catch {
    try {
      url = new URL('https://' + raw);
    } catch {
      url = null;
    }
  }

  // Si tenemos una URL, intentar extraer el parámetro `notice` (específico de enlaces SECOP),
  // y validar que sea un NTC válido.
  if (url) {
    const params = url.searchParams;
    // 1) parámetro explícito notice debe ser un NTC válido
    const notice = params.get('notice');
    if (notice) {
      // Validar formato NTC (CO1.NTC.número o similar)
      const m = String(notice).match(/^(CO1\.)?NTC\.\d+$/i);
      if (m) return notice;
    }

    // 2) a veces los enlaces contienen otra URL en prevCtxUrl (codificada)
    const nested =
      params.get('prevCtxUrl') ||
      params.get('prevctxurl') ||
      params.get('prevCtx') ||
      null;
    if (nested) {
      try {
        const decoded = decodeURIComponent(nested);
        // buscar notice= con formato NTC válido
        const nMatch = decoded.match(/notice=((?:CO1\.)?NTC\.\d+)/i);
        if (nMatch) return nMatch[1];
      } catch {
        // ignorar errores de decodificación
      }
    }

    // Ya no buscamos otros parámetros o segmentos, requerimos NTC válido
    return null;
  }

  // Si la entrada no es una URL válida, intentar extraer un token parecido a código
  // (letras/números y -_). Permitimos puntos en los tokens (ej. CO1.NTC.8934774)
  // para no truncar a sólo la parte numérica al final.
  const m = raw.match(/([A-Za-z0-9._-]{3,})$/);
  if (m) return m[1];
  return raw;
}
