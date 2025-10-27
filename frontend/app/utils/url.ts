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
  // luego otros parámetros comunes. También intentar decodificar URLs anidadas (ej. prevCtxUrl).
  if (url) {
    const params = url.searchParams;
    // 1) parámetro explícito notice
    const notice = params.get('notice');
    if (notice) {
      // truncar en el primer & o % por si el valor está codificado dentro de una cadena mayor
      const m = String(notice).match(/^([^&%]+)/);
      if (m) return m[1];
      return notice;
    }

    // 2) a veces los enlaces contienen otra URL en prevCtxUrl (codificada); buscar dentro
    const nested =
      params.get('prevCtxUrl') ||
      params.get('prevctxurl') ||
      params.get('prevCtx') ||
      null;
    if (nested) {
      try {
        const decoded = decodeURIComponent(nested);
        // intentar encontrar notice= dentro de la cadena decodificada
        const nMatch = decoded.match(/notice=([^&%]+)/i);
        if (nMatch) return nMatch[1];
      } catch {
        // ignorar errores de decodificación
      }
    }

    // 3) otros parámetros comunes
    const candidates = ['id', 'codigo', 'code', 'ref', 'token'];
    for (const k of candidates) {
      const v = params.get(k);
      if (v) return v;
    }

    // 4) de lo contrario, usar el último segmento no vacío del pathname
    const segs = url.pathname
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);
    if (segs.length > 0) return segs[segs.length - 1];
    // 5) fallback al hostname sin www
    const host = url.hostname.replace(/^www\./, '');
    return host || null;
  }

  // Si la entrada no es una URL válida, intentar extraer un token parecido a código
  // (letras/números y -_). Permitimos puntos en los tokens (ej. CO1.NTC.8934774)
  // para no truncar a sólo la parte numérica al final.
  const m = raw.match(/([A-Za-z0-9._-]{3,})$/);
  if (m) return m[1];
  return raw;
}
