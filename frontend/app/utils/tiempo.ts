// Funciones auxiliares compartidas para calcular la columna "tiempo"
// (seleccionar la fecha relevante y convertir el tiempo restante a formato legible)
export function remainingTime(fecha?: string | null): string {
  if (!fecha) return '-';
  const target = new Date(fecha);
  if (Number.isNaN(target.getTime())) return '-';
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Vencido';
  const msInMinute = 1000 * 60;
  const msInHour = msInMinute * 60;
  const msInDay = msInHour * 24;
  const days = Math.floor(diff / msInDay);
  const hours = Math.floor((diff % msInDay) / msInHour);
  const minutes = Math.floor((diff % msInHour) / msInMinute);

  const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? '' : 's'}`;

  if (days > 0) {
    return `${plural(days, 'día')} ${hours > 0 ? plural(hours, 'hora') : ''}`.trim();
  }
  if (hours > 0) {
    return `${plural(hours, 'hora')} ${minutes > 0 ? plural(minutes, 'min') : ''}`.trim();
  }
  if (minutes > 0) return `${plural(minutes, 'min')}`;
  return 'Menos de 1 min';
}

export function pickFechaFromProceso(p: any): {
  fecha: string | null;
  tipoNombre: string | null;
} {
  // defensivo: si p es null/undefined o no es un objeto, devolver nulos
  if (!p || typeof p !== 'object') return { fecha: null, tipoNombre: null };
  // Prefer fechas array if present
  // Preferir el array `fechas` si está presente
  if (p.fechas && Array.isArray(p.fechas) && p.fechas.length > 0) {
    try {
      const valid = p.fechas
        .map((f: any) => ({
          ...f,
          ts: f.fecha ? new Date(f.fecha).getTime() : NaN,
        }))
        .filter((f: any) => !Number.isNaN(f.ts));
      if (valid.length === 0) return { fecha: null, tipoNombre: null };
      // Preferir una fecha explícitamente marcada como "importante" cuando exista
      // (alineado con la lógica de renderizado de la tabla)
      const impMarked = valid.find(
        (f: any) => !!f.importante && f.ts && !Number.isNaN(f.ts),
      );
      if (impMarked) {
        const tipoNombre =
          impMarked.tipoFechaProceso?.nombre ??
          impMarked['tipo_fecha_proceso']?.nombre ??
          null;
        return { fecha: impMarked.fecha ?? null, tipoNombre };
      }
      const nowTs = Date.now();
      const future = valid.filter((f: any) => f.ts >= nowTs);
      if (future.length > 0) {
        future.sort((a: any, b: any) => a.ts - b.ts);
        const chosen = future[0];
        const tipoNombre =
          chosen.tipoFechaProceso?.nombre ??
          chosen['tipo_fecha_proceso']?.nombre ??
          null;
        return { fecha: chosen.fecha ?? null, tipoNombre };
      }
      valid.sort((a: any, b: any) => b.ts - a.ts);
      const chosenPast = valid[0];
      const tipoNombrePast =
        chosenPast.tipoFechaProceso?.nombre ??
        chosenPast['tipo_fecha_proceso']?.nombre ??
        null;
      return { fecha: chosenPast.fecha ?? null, tipoNombre: tipoNombrePast };
    } catch {
      return { fecha: null, tipoNombre: null };
    }
  }
  // Alternativa: usar campos aplanados (cuando no existe `fechas`)
  return {
    fecha: p.fecha_proceso ?? null,
    tipoNombre: p.tipo_fecha_proceso?.nombre ?? null,
  };
}

export function formatFecha(fecha?: string | null): string {
  if (!fecha) return '-';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return '-';

  // Usar Intl para obtener las partes en la zona horaria America/Bogota (Colombia)
  try {
    const fmt = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    // formatToParts nos devuelve componentes para reorganizar
    const parts = fmt.formatToParts(date);
    const part = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? '';
    const day = part('day');
    const month = part('month');
    const year = part('year');
    const hour = part('hour').padStart(2, '0');
    const minute = part('minute').padStart(2, '0');
    const dayPeriod = part('dayPeriod').toLowerCase();
    return `${day}/${month}/${year} - ${hour}:${minute} ${dayPeriod}`;
  } catch {
    // Recurso alternativo: formateo local si Intl falla por cualquier razón
    const d = date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hourStr = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} - ${hourStr}:${minutes} ${ampm}`;
  }
}

/**
 * Parsear la entrada del usuario en formatos locales colombianos a una cadena
 * ISO UTC.
 * Soporta:
 *  - dd/mm/yyyy
 *  - dd/mm/yyyy - hh:mm am/pm
 *  - dd/mm/yyyy hh:mm am/pm
 *  - YYYY-MM-DD o formato ISO completo (será normalizado a ISO)
 * Devuelve cadena ISO (UTC) o null si no se puede parsear.
 */
export function parseFechaLocalToISO(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null;

  // If looks like an ISO / YYYY-MM-DD or full ISO, try to parse and normalize using Colombia timezone if date-only
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const fullIsoLike = /\d{4}-\d{2}-\d{2}T/;
  // datetime-local without timezone (e.g. 2025-10-13T09:00)
  const datetimeLocalRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  try {
    if (fullIsoLike.test(s)) {
      // handle datetime-local (no timezone) by appending Colombia offset -05:00
      if (datetimeLocalRe.test(s)) {
        const isoWithOffset = `${s}:00-05:00`;
        const d = new Date(isoWithOffset);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    if (isoDateOnly.test(s)) {
      // treat as date in Colombia at midnight
      const isoWithOffset = `${s}T00:00:00-05:00`;
      const d = new Date(isoWithOffset);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  } catch {
    // ignore and try local parse
  }

  // Formato local: dd/mm/yyyy [ - ] hh:mm [ am|pm ]
  // Acepta '/' o '-' entre partes de la fecha; usamos la clase de caracteres [/-]
  // para coincidir con '/' o '-' sin escapar '/'. Construimos la regex con el
  // constructor para evitar escapar '/'.
  const re = new RegExp(
    '^\\s*(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})(?:\\s*-?\\s*(\\d{1,2}):(\\d{2})(?:\\s*([ap]m))?)?\\s*$',
    'i',
  );
  const m = s.match(re as RegExp);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  let hour = m[4] ? Number(m[4]) : 0;
  const minute = m[5] ? Number(m[5]) : 0;
  const ampm = m[6] ? m[6].toLowerCase() : null;

  if (ampm) {
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
  }
  // Basic validation
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;

  // Build an ISO that includes Colombia offset (-05:00) so Date parses correctly as that local time
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  // Colombia is fixed at -05:00 (no DST)
  const isoWithOffset = `${year}-${mm}-${dd}T${hh}:${min}:00-05:00`;
  const d = new Date(isoWithOffset);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Convertir una marca de tiempo ISO (UTC) a una cadena usable por
 * <input type="datetime-local"> en la zona horaria esperada (Colombia -05:00).
 * Devuelve un valor como 'YYYY-MM-DDTHH:MM' o null si es inválido.
 */
export function isoToDatetimeLocal(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // Convertir a hora de Colombia aplicando offset -05:00.
  // Construimos un objeto Date que represente el mismo instante y calculamos
  // los componentes locales de Colombia restando 5 horas en milisegundos.
  const offsetMs = 5 * 60 * 60 * 1000; // 5 hours
  const colombiaTs = d.getTime() - offsetMs;
  const cd = new Date(colombiaTs);
  const YYYY = cd.getUTCFullYear();
  const MM = String(cd.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(cd.getUTCDate()).padStart(2, '0');
  const hh = String(cd.getUTCHours()).padStart(2, '0');
  const mm = String(cd.getUTCMinutes()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

/**
 * Dividir una marca ISO en { date, time } adecuado para <input type="date"> y
 * <input type="time">.
 * Devuelve { date: 'YYYY-MM-DD' | null, time: 'HH:MM' | null }
 */
export function isoToDateAndTime(iso?: string | null): {
  date: string | null;
  time: string | null;
} {
  const dt = isoToDatetimeLocal(iso);
  if (!dt) return { date: null, time: null };
  const [date, time] = dt.split('T');
  return { date: date ?? null, time: time ?? null };
}

/**
 * Combina una fecha 'YYYY-MM-DD' y una hora 'HH:MM' en una cadena ISO (UTC)
 * interpretando los valores suministrados en la zona horaria de Colombia
 * (America/Bogota, fijo -05:00).
 * Devuelve cadena ISO (UTC) o null si es inválido.
 */
export function combineDateAndTimeToISO(
  date?: string | null,
  time?: string | null,
): string | null {
  if (!date || typeof date !== 'string') return null;
  const d = date.trim();
  const t = (time ?? '').trim();
  // basic validation - require an explicit time (do not default to midnight)
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const timeRe = /^\d{2}:\d{2}$/;
  if (!dateRe.test(d)) return null;
  if (!t) return null; // missing time should be considered invalid here
  if (!timeRe.test(t)) return null;
  const isoWithOffset = `${d}T${t}:00-05:00`;
  const parsed = new Date(isoWithOffset);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}
