'use client';

// -----------------------------------------------------------------------------
// Componente: ProcessTable
// Propósito: Mostrar tabla de procesos con filtros, persistencia de filtros en URL
// y vista resumida (fecha/tipo/valor/estado).
// Notas de cambios: se agregaron y consolidaron comentarios en español y se
// organizaron secciones (imports, tipos, estado, helpers, efectos, render).
// La lógica funcional permanece sin cambios.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import DatePicker from '@/components/forms/DatePicker';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import ProcessCreateModal from '@/components/modals/ProcessCreateModal';
import { useRouter } from 'next/navigation';
import {
  pickFechaFromProceso,
  remainingTime,
  formatFecha,
} from '@utils/format/tiempo';
import { formatThousands } from '@utils/format/number';
import { API_ROUTES } from '@utils/api/routes';

// Helper local: obtener tipoNombre normalizado (trim + toLowerCase) para comparaciones
const getTipoNombreNormalized = (p: Proceso): string | null => {
  try {
    // Si alguna fecha está marcada explícitamente como "importante", darle prioridad
    if (p && Array.isArray(p.fechas) && p.fechas.length > 0) {
      const imp = p.fechas.find((f: any) => !!f.importante && f.fecha);
      if (imp && imp.fecha) {
        const raw =
          (imp as any).tipoFechaProceso?.nombre ??
          (imp as any)['tipo_fecha_proceso']?.nombre ??
          null;
        return raw ? String(raw).trim().toLowerCase() : null;
      }
    }
  } catch {
    // ignore and fallback to pickFechaFromProceso
  }
  const f = pickFechaFromProceso(p);
  const raw = f?.tipoNombre ?? null;
  return raw ? String(raw).trim().toLowerCase() : null;
};

// -------------------------
// Tipos locales (temporal)
// -------------------------
type Entidad = { id: number; nombre: string };
type Lote = { id: number; valor?: number | string };
type Proceso = {
  id: number;
  objeto?: string;
  entidad?: Entidad;
  anticipo?: number;
  lotes?: Lote[];
  tipo_fecha_proceso?: { id?: number; nombre?: string } | null;
  fecha_proceso?: string | null;
  fechas?: Array<{
    id?: number;
    fecha?: string | null;
    tipoFechaProceso?: { id?: number; nombre?: string } | null;
  }>;
};

export default function ProcessTable() {
  // Estilo inline para inputs: quitar los 'spinners' nativos en algunos navegadores.
  // Se inyecta dinámicamente para evitar tocar CSS global.
  useEffect(() => {
    const id = 'process-table-no-spinner-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `
      .no-spinner::-webkit-outer-spin-button,
      .no-spinner::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .no-spinner[type=number] {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);
  }, []);
  const [items, setItems] = useState<Proceso[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // -------------------------
  // Estado: filtros y controles de UI
  // -------------------------
  // Inputs en vivo (se debouncean para aplicar filtros tipo "contains")
  const [objetoInput, setObjetoInput] = useState('');
  const [objetoFilter, setObjetoFilter] = useState('');
  const [entidadInput, setEntidadInput] = useState('');
  const [entidadFilter, setEntidadFilter] = useState('');
  const [anticipoMin, setAnticipoMin] = useState<number | ''>('');
  const [anticipoMax, setAnticipoMax] = useState<number | ''>('');
  const [valorMin, setValorMin] = useState<string | ''>('');
  const [valorMax, setValorMax] = useState<string | ''>('');
  const [tipoFechaSelected, setTipoFechaSelected] = useState<string | ''>('');
  const [fechaStart, setFechaStart] = useState<string | ''>('');
  const [fechaEnd, setFechaEnd] = useState<string | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<string | ''>('');
  const [tiempoMinDays, setTiempoMinDays] = useState<number | ''>('');
  const [tiempoMaxDays, setTiempoMaxDays] = useState<number | ''>('');
  const [tiempoOption, setTiempoOption] = useState<string | ''>('');
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [estadoList, setEstadoList] = useState<
    Array<{ id: number; nombre: string }>
  >([]);

  // Inicializar `filtersOpen` desde localStorage (solo en cliente)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const v = window.localStorage.getItem('processTable.filtersOpen');
      if (v !== null) setFiltersOpen(v === '1');
    } catch {
      // ignore
    }
  }, []);

  // Persistir `filtersOpen` en localStorage cuando cambie
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        'processTable.filtersOpen',
        filtersOpen ? '1' : '0',
      );
    } catch {
      // ignore
    }
  }, [filtersOpen]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(API_ROUTES.PROCESOS);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        if (mounted) setItems(Array.isArray(data) ? data : [data]);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    // cargar lista de estados para lookup por nombre
    (async () => {
      try {
        const r = await fetch(API_ROUTES.ESTADO_PROCESO);
        if (!r.ok) return;
        const data = await r.json();
        setEstadoList(Array.isArray(data) ? data : [data]);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ROUTES.PROCESOS);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : [data]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setObjetoInput('');
    setObjetoFilter('');
    setEntidadInput('');
    setEntidadFilter('');
    setAnticipoMin('');
    setAnticipoMax('');
    setValorMin('');
    setValorMax('');
    setTipoFechaSelected('');
    setFechaStart('');
    setFechaEnd('');
    setTiempoMinDays('');
    setTiempoMaxDays('');
    setTiempoOption('');
    setEstadoFilter('');
  };
  // debounce: inputs 'objeto' y 'entidad' -> aplican filtro 'contains' tras retardo
  useEffect(() => {
    const t = setTimeout(
      () => setObjetoFilter(objetoInput.trim().toLowerCase()),
      300,
    );
    return () => clearTimeout(t);
  }, [objetoInput]);

  useEffect(() => {
    const t = setTimeout(
      () => setEntidadFilter(entidadInput.trim().toLowerCase()),
      300,
    );
    return () => clearTimeout(t);
  }, [entidadInput]);

  // Persistencia en URL: leer filtros iniciales desde querystring (cliente)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const qObjeto = sp.get('objeto') ?? '';
    const qEntidad = sp.get('entidad') ?? '';
    const qAntMin = sp.get('anticipoMin') ?? '';
    const qAntMax = sp.get('anticipoMax') ?? '';
    const qValMin = sp.get('valorMin') ?? '';
    const qValMax = sp.get('valorMax') ?? '';
    const qTipo = sp.get('tipoFecha') ?? '';
    const qFStart = sp.get('fechaStart') ?? '';
    const qFEnd = sp.get('fechaEnd') ?? '';
    const qEstado = sp.get('estado') ?? '';
    const qTiempo = sp.get('tiempo') ?? '';
    const qTiempoMin = sp.get('tiempoMin') ?? '';
    const qTiempoMax = sp.get('tiempoMax') ?? '';
    setObjetoInput(qObjeto);
    setEntidadInput(qEntidad);
    setAnticipoMin(qAntMin === '' ? '' : Number(qAntMin));
    setAnticipoMax(qAntMax === '' ? '' : Number(qAntMax));
    setValorMin(qValMin === '' ? '' : String(qValMin));
    setValorMax(qValMax === '' ? '' : String(qValMax));
    setTipoFechaSelected(qTipo as any);
    setFechaStart(qFStart as any);
    setFechaEnd(qFEnd as any);
    setEstadoFilter(qEstado as any);
    setTiempoOption(qTiempo as any);
    setTiempoMinDays(qTiempoMin === '' ? '' : Number(qTiempoMin));
    setTiempoMaxDays(qTiempoMax === '' ? '' : Number(qTiempoMax));
    // ejecutar sólo una vez al montar
  }, []);

  // Cuando los filtros cambian, actualizar la URL (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (objetoFilter) params.set('objeto', objetoFilter);
      if (entidadFilter) params.set('entidad', entidadFilter);
      if (anticipoMin !== '') params.set('anticipoMin', String(anticipoMin));
      if (anticipoMax !== '') params.set('anticipoMax', String(anticipoMax));
      if (valorMin !== '') params.set('valorMin', String(valorMin));
      if (valorMax !== '') params.set('valorMax', String(valorMax));
      if (tipoFechaSelected)
        params.set('tipoFecha', tipoFechaSelected as string);
      if (estadoFilter) params.set('estado', String(estadoFilter));
      if (fechaStart) params.set('fechaStart', String(fechaStart));
      if (fechaEnd) params.set('fechaEnd', String(fechaEnd));
      if (tiempoOption) params.set('tiempo', String(tiempoOption));
      if (tiempoOption === 'personalizado') {
        if (tiempoMinDays !== '')
          params.set('tiempoMin', String(tiempoMinDays));
        if (tiempoMaxDays !== '')
          params.set('tiempoMax', String(tiempoMaxDays));
      }
      const path = window.location.pathname;
      const queryString = params.toString();

      // Create the new URL properly with Next.js App Router
      const newPath = queryString ? `${path}?${queryString}` : path;
      router.replace(newPath as any);
    }, 300);
    return () => clearTimeout(t);
  }, [
    objetoFilter,
    entidadFilter,
    anticipoMin,
    anticipoMax,
    valorMin,
    valorMax,
    tipoFechaSelected,
    fechaStart,
    fechaEnd,
    tiempoOption,
    estadoFilter,
    router,
    tiempoMinDays,
    tiempoMaxDays,
  ]);

  // Helper: formatear el valor total (suma de lotes)
  const formatValor = (p: Proceso) => {
    // Sumamos los valores de los lotes del proceso
    if (!p.lotes || p.lotes.length === 0) return '-';
    const vals = p.lotes.map((l) => {
      if (l == null) return 0;
      const v = l.valor;
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (typeof v === 'string') {
        // eliminar caracteres no numéricos (como separadores de miles, signos, etc.)
        const cleaned = v.replace(/[^0-9.-]+/g, '');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    });
    const sum = vals.reduce((a, b) => a + b, 0);
    const formatted = Number(sum).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (p.lotes.length === 1) return `$ ${formatted}`;
    return `(${p.lotes.length}) $ ${formatted}`;
  };

  // Helper: parsear entradas numéricas de filtros que pueden contener separador de miles (.) o coma decimal
  const parseFilterNumber = (s: string | number | ''): number => {
    if (s === '' || s == null) return NaN;
    if (typeof s === 'number') return s;
    const cleaned = String(s)
      .trim()
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isNaN(n) ? NaN : n;
  };

  // -------------------------
  // Lógica de filtrado: aplicar todos los filtros (AND)
  // -------------------------
  const filteredItems = (items || []).filter((p) => {
    // filtro 'objeto' por contains (se aplica con debounce)
    if (objetoFilter) {
      const text = (p.objeto || '').toLowerCase();
      if (!text.includes(objetoFilter)) return false;
    }
    // filtro 'entidad' por contains (se aplica con debounce)
    if (entidadFilter) {
      const ent = (p.entidad?.nombre || '').toLowerCase();
      if (!ent.includes(entidadFilter)) return false;
    }
    // rango de anticipo: aplicar anticipoMax sólo cuando sea estrictamente mayor que anticipoMin
    if (anticipoMin !== '' || anticipoMax !== '') {
      const a =
        typeof p.anticipo === 'number'
          ? p.anticipo
          : p.anticipo
          ? Number(p.anticipo)
          : NaN;
      if (Number.isNaN(a)) return false;
      if (anticipoMin !== '' && a < Number(anticipoMin)) return false;
      // only enforce max if both min and max are provided and max > min
      if (
        anticipoMax !== '' &&
        anticipoMin !== '' &&
        Number(anticipoMax) > Number(anticipoMin) &&
        a > Number(anticipoMax)
      )
        return false;
    }
    // rango de valor (suma de lotes) - aplicar valorMax sólo cuando sea estrictamente mayor que valorMin
    if (valorMin !== '' || valorMax !== '') {
      // compute numeric valor sum robustly (handle string formats like '1.234,56' or '1,234.56')
      const valor = (p.lotes || []).reduce((sum, l) => {
        if (l == null) return sum;
        const v = (l as any).valor;
        if (typeof v === 'number') return sum + (isNaN(v) ? 0 : v);
        if (typeof v === 'string') {
          const cleaned = String(v).replace(/[^0-9.-]+/g, '');
          const n = parseFloat(cleaned);
          return sum + (Number.isNaN(n) ? 0 : n);
        }
        return sum;
      }, 0);
      const minVal = parseFilterNumber(valorMin as any);
      const maxVal = parseFilterNumber(valorMax as any);
      if (!Number.isNaN(minVal) && valor < minVal) return false;
      if (
        !Number.isNaN(maxVal) &&
        !Number.isNaN(minVal) &&
        maxVal > minVal &&
        valor > maxVal
      )
        return false;
    }
    // filtro por tipo de fecha (normalizar ambos lados y preferir la fecha marcada como 'importante')
    if (tipoFechaSelected !== '') {
      const tn = getTipoNombreNormalized(p);
      if (!tn) return false;
      if (tn !== String(tipoFechaSelected).trim().toLowerCase()) return false;
    }
    // filtro por estado (soporta tanto objeto como id primitivo)
    if (estadoFilter !== '') {
      const val = (p as any).estado;
      if (val == null) return false;
      if (typeof val === 'object') {
        const id = val.id ?? val.ID ?? (val as any).estadoId;
        if (String(id) !== String(estadoFilter)) return false;
      } else {
        if (String(val) !== String(estadoFilter)) return false;
      }
    }
    // rango de fecha (fecha más cercana) - aplicar fechaEnd sólo cuando sea estrictamente posterior a fechaStart
    if (fechaStart !== '' || fechaEnd !== '') {
      const f = pickFechaFromProceso(p);
      if (!f) return false;
      const fechaISO = f.fecha;
      if (!fechaISO) return false;
      const fv = new Date(fechaISO);
      if (fechaStart !== '') {
        const s = new Date(String(fechaStart));
        if (fv < s) return false;
      }
      if (fechaEnd !== '') {
        // only enforce end if start is provided and end > start
        if (fechaStart !== '') {
          const s = new Date(String(fechaStart));
          const e = new Date(String(fechaEnd));
          if (e > s) {
            if (fv > e) return false;
          }
        }
      }
    }
    // rango de tiempo restante en días
    // manejo de la opción "tiempo": mapear la opción a un umbral de fecha
    if (tiempoOption !== '') {
      const f = pickFechaFromProceso(p);
      if (!f) return false;
      if (!f.fecha) return false;
      const now = Date.now();
      const remDays =
        (new Date(f.fecha).getTime() - now) / (1000 * 60 * 60 * 24);
      if (tiempoOption === 'vencido') {
        // remDays < 0
        if (!(remDays < 0)) return false;
      } else if (tiempoOption === 'menos-1') {
        if (!(remDays >= 0 && remDays <= 1)) return false;
      } else if (tiempoOption === 'esta-semana') {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(
          startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        if (
          !(
            new Date(f.fecha).getTime() >= startOfWeek.getTime() &&
            new Date(f.fecha).getTime() < endOfWeek.getTime()
          )
        )
          return false;
      } else if (tiempoOption === 'este-mes') {
        const nowD = new Date();
        const startOfMonth = new Date(
          nowD.getFullYear(),
          nowD.getMonth(),
          1,
          0,
          0,
          0,
          0,
        ).getTime();
        const endOfMonth = new Date(
          nowD.getFullYear(),
          nowD.getMonth() + 1,
          1,
          0,
          0,
          0,
          0,
        ).getTime();
        if (
          !(
            new Date(f.fecha).getTime() >= startOfMonth &&
            new Date(f.fecha).getTime() < endOfMonth
          )
        )
          return false;
      } else if (tiempoOption === 'este-ano') {
        const nowD = new Date();
        const startOfYear = new Date(
          nowD.getFullYear(),
          0,
          1,
          0,
          0,
          0,
          0,
        ).getTime();
        const endOfYear = new Date(
          nowD.getFullYear() + 1,
          0,
          1,
          0,
          0,
          0,
          0,
        ).getTime();
        if (
          !(
            new Date(f.fecha).getTime() >= startOfYear &&
            new Date(f.fecha).getTime() < endOfYear
          )
        )
          return false;
      } else if (tiempoOption === 'personalizado') {
        if (tiempoMinDays !== '' && remDays < Number(tiempoMinDays))
          return false;
        if (tiempoMaxDays !== '') {
          if (tiempoMinDays !== '') {
            //Cuando se especifica un mínimo, solo se aplicará el máximo si este es mayor que el mínimo.
            if (
              Number(tiempoMaxDays) > Number(tiempoMinDays) &&
              remDays > Number(tiempoMaxDays)
            )
              return false;
          } else {
            // Cuando el mínimo está vacío, se aplica el máximo incondicionalmente
            if (remDays > Number(tiempoMaxDays)) return false;
          }
        }
      }
    }
    return true;
  });

  if (loading) return <div className="p-4">Cargando procesos…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold flex items-center gap-3">
          Filtros
          <Button
            variant="secondary"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((s) => !s)}
            aria-label={filtersOpen ? 'Cerrar filtros' : 'Abrir filtros'}
            className="w-8 h-8 px-0"
          >
            <span className="text-lg leading-none">
              {filtersOpen ? '−' : '+'}
            </span>
          </Button>
        </h2>
      </div>
      {/* Panel de filtros - colapsable con transición */}
      {/* Render: panel de filtros (colapsable). Contiene controles para filtrar
      por entidad, objeto, rango valor/anticipo, tipo de fecha y tiempo restante. */}
      <div
        aria-hidden={!filtersOpen}
        className={`mb-4 p-4 bg-white rounded-lg shadow-md border overflow-hidden transition-all duration-300 ease-in-out ${
          filtersOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Entidad
            </label>
            <div className="mt-2">
              <input
                value={entidadInput}
                onChange={(e) => setEntidadInput(e.target.value)}
                placeholder="Escribe para filtrar entidad"
                className="border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 px-3 py-2 w-full rounded-md bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Objeto
            </label>
            <div className="mt-2">
              <input
                value={objetoInput}
                onChange={(e) => setObjetoInput(e.target.value)}
                placeholder="Escribe para filtrar objeto"
                className="border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 px-3 py-2 w-full rounded-md bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Valor (min / max)
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                  $
                </span>
                <input
                  type="text"
                  value={valorMin as any}
                  onChange={(e) => {
                    const raw = String(e.target.value || '').replace(
                      /[^0-9]/g,
                      '',
                    );
                    if (raw === '') return setValorMin('');
                    const truncated = raw.slice(0, 15); // límite de 15 dígitos
                    setValorMin(formatThousands(truncated));
                  }}
                  placeholder="min"
                  className="border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 px-3 py-2 pl-8 w-full rounded-md bg-white text-gray-900"
                />
              </div>
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                  $
                </span>
                <input
                  type="text"
                  value={valorMax as any}
                  onChange={(e) => {
                    const raw = String(e.target.value || '').replace(
                      /[^0-9]/g,
                      '',
                    );
                    if (raw === '') return setValorMax('');
                    const truncated = raw.slice(0, 15); // límite de 15 dígitos
                    setValorMax(formatThousands(truncated));
                  }}
                  placeholder="max"
                  className="border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 px-3 py-2 pl-8 w-full rounded-md bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Anticipo (min / max %)
            </label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                step={1}
                min={0}
                max={50}
                inputMode="numeric"
                value={anticipoMin as any}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === '') return setAnticipoMin('');
                  const parsed = Number(raw);
                  if (Number.isNaN(parsed)) return; // ignore caracteres inválidos
                  const truncated = Math.trunc(parsed);
                  const clamped = Math.max(0, Math.min(50, truncated));
                  setAnticipoMin(clamped as any);
                }}
                onBlur={() => {
                  if (anticipoMin === '') return;
                  const n = Number(anticipoMin);
                  if (Number.isNaN(n)) return setAnticipoMin('');
                  setAnticipoMin(
                    Math.max(0, Math.min(50, Math.trunc(n))) as any,
                  );
                }}
                placeholder="min"
                className="no-spinner border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 px-3 py-2 w-1/3 rounded-md bg-white text-gray-900"
              />
              <input
                type="number"
                step={1}
                min={0}
                max={50}
                inputMode="numeric"
                value={anticipoMax as any}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === '') return setAnticipoMax('');
                  const parsed = Number(raw);
                  if (Number.isNaN(parsed)) return; // ignore caracteres inválidos
                  const truncated = Math.trunc(parsed);
                  const clamped = Math.max(0, Math.min(50, truncated));
                  setAnticipoMax(clamped as any);
                }}
                onBlur={() => {
                  if (anticipoMax === '') return;
                  const n = Number(anticipoMax);
                  if (Number.isNaN(n)) return setAnticipoMax('');
                  setAnticipoMax(
                    Math.max(0, Math.min(50, Math.trunc(n))) as any,
                  );
                }}
                placeholder="max"
                className="no-spinner border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 px-3 py-2 w-1/3 rounded-md bg-white text-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Tipo de fecha
            </label>
            <div className="mt-2">
              <select
                value={tipoFechaSelected}
                onChange={(e) => setTipoFechaSelected(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-md bg-white text-gray-900 w-full"
              >
                <option value="">(Todos)</option>
                {/*derivar opciones dinámicamente a partir de elementos (normalizados)*/}
                {Array.from(
                  new Set(
                    (items || [])
                      .map((p) => getTipoNombreNormalized(p))
                      .filter(Boolean),
                  ),
                ).map((t) => (
                  // Muestra la carcasa original buscando cualquier elemento con este valor normalizado.
                  <option key={String(t)} value={String(t)}>
                    {String(
                      ((items || []).find(
                        (p) => getTipoNombreNormalized(p) === t,
                      ) &&
                        pickFechaFromProceso(
                          (items || []).find(
                            (p) => getTipoNombreNormalized(p) === t,
                          ) as any,
                        ).tipoNombre) ??
                        t,
                    )}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Estado
            </label>
            <div className="mt-2">
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-md bg-white text-gray-900 w-full"
              >
                <option value="">(Todos)</option>
                {estadoList.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Fecha (desde / hasta)
            </label>
            <div className="flex gap-2 mt-2">
              <div className="w-1/2">
                <DatePicker
                  value={fechaStart as any}
                  onChangeAction={(v: string) => setFechaStart(v as any)}
                  placeholder="Desde"
                />
              </div>
              <div className="w-1/2">
                <DatePicker
                  value={fechaEnd as any}
                  onChangeAction={(v: string) => setFechaEnd(v as any)}
                  placeholder="Hasta"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Tiempo restante
            </label>
            <div className="mt-2">
              <select
                value={tiempoOption}
                onChange={(e) => setTiempoOption(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-md bg-white text-gray-900 w-full"
              >
                <option value="">(Todos)</option>
                <option value="vencido">Vencido</option>
                <option value="menos-1">Menos de 1 día</option>
                <option value="esta-semana">Esta semana</option>
                <option value="este-mes">Este mes</option>
                <option value="este-ano">Este año</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
            {tiempoOption === 'personalizado' && (
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  step={1}
                  min={0}
                  inputMode="numeric"
                  value={tiempoMinDays as any}
                  onChange={(e) => {
                    const raw = String(e.target.value || '').trim();
                    if (raw === '') return setTiempoMinDays('');
                    // Solo se aceptan números enteros no negativos (sin decimales, comas ni signos).
                    if (!/^[0-9]+$/.test(raw)) return;
                    const truncated = raw.slice(0, 4); // limitar a 4 dígitos
                    const n = Math.max(0, Math.trunc(Number(truncated)));
                    setTiempoMinDays(n as any);
                  }}
                  onBlur={() => {
                    if (tiempoMinDays === '') return;
                    const n = Number(tiempoMinDays);
                    if (Number.isNaN(n)) return setTiempoMinDays('');
                    setTiempoMinDays(
                      Math.max(0, Math.min(9999, Math.trunc(n))) as any,
                    );
                  }}
                  placeholder="min días"
                  className="no-spinner border border-gray-300 px-3 py-2 rounded-md bg-white text-gray-900 w-1/2"
                />
                <input
                  type="number"
                  step={1}
                  min={0}
                  inputMode="numeric"
                  value={tiempoMaxDays as any}
                  onChange={(e) => {
                    const raw = String(e.target.value || '').trim();
                    if (raw === '') return setTiempoMaxDays('');
                    // Solo se aceptan números enteros no negativos (sin decimales, comas ni signos).
                    if (!/^[0-9]+$/.test(raw)) return;
                    const truncated = raw.slice(0, 4); // limitar a 4 dígitos
                    const n = Math.max(0, Math.trunc(Number(truncated)));
                    setTiempoMaxDays(n as any);
                  }}
                  onBlur={() => {
                    if (tiempoMaxDays === '') return;
                    const n = Number(tiempoMaxDays);
                    if (Number.isNaN(n)) return setTiempoMaxDays('');
                    setTiempoMaxDays(
                      Math.max(0, Math.min(9999, Math.trunc(n))) as any,
                    );
                  }}
                  placeholder="max días"
                  className="no-spinner border border-gray-300 px-3 py-2 rounded-md bg-white text-gray-900 w-1/2"
                />
              </div>
            )}
          </div>

          <div className="col-span-4 mt-2 flex items-center justify-start">
            <Button variant="primary" onClick={clearFilters}>
              Borrar filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Procesos</h2>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Crear proceso
          </Button>
        </div>
      </div>

      <ProcessCreateModal
        open={createOpen}
        onCloseAction={() => setCreateOpen(false)}
        onCreatedAction={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <table className="min-w-full text-base text-left border-collapse text-gray-900">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-3 border text-gray-800">ID</th>
            <th className="px-4 py-3 border text-gray-800">Entidad</th>
            <th className="px-4 py-3 border text-gray-800">Objeto</th>
            <th className="px-4 py-3 border text-gray-800">Valor</th>
            <th className="px-4 py-3 border text-gray-800">Anticipo</th>
            <th className="px-4 py-3 border text-gray-800">Estado</th>
            <th className="px-4 py-3 border text-gray-800">Tipo de fecha</th>
            <th className="px-4 py-3 border text-gray-800">Fecha</th>
            <th className="px-4 py-3 border text-gray-800">Tiempo</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="px-4 py-6 border text-center text-gray-600"
              >
                No hay procesos. Usa el botón "Crear proceso" para añadir uno.
              </td>
            </tr>
          ) : (
            filteredItems.map((p) => (
              <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-4 py-3 border align-top text-gray-800">
                  {p.id}
                </td>
                <td className="px-4 py-3 border align-top text-gray-800">
                  {p.entidad?.nombre ?? '-'}
                </td>
                <td className="px-4 py-3 border align-top text-gray-800">
                  {p.objeto ? (
                    <Link
                      href={`/procesos/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {p.objeto}
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 border align-top text-gray-800">
                  {formatValor(p)}
                </td>
                <td className="px-4 py-3 border align-top text-gray-800">
                  {(() => {
                    const a =
                      typeof p.anticipo === 'number'
                        ? p.anticipo
                        : p.anticipo
                        ? Number(p.anticipo)
                        : NaN;
                    if (Number.isNaN(a)) return '-';
                    const clamped = Math.max(0, Math.min(50, a));
                    const display = `${clamped}%`;
                    if (a !== clamped)
                      return (
                        <span title={`Valor original: ${a}`}>{display}</span>
                      );
                    return <>{display}</>;
                  })()}
                </td>
                <td className="px-4 py-3 border align-top text-gray-800">
                  {(() => {
                    const val = (p as any).estado;
                    if (val == null) return '-';
                    if (typeof val === 'object')
                      return val.nombre ?? String(val.id ?? val.ID ?? '-');
                    const found = estadoList.find(
                      (s) => String(s.id) === String(val),
                    );
                    return found ? found.nombre : String(val);
                  })()}
                </td>
                {(() => {
                  let picked: {
                    fecha: string | null;
                    tipoNombre: string | null;
                  } | null = null;
                  try {
                    if (p && Array.isArray(p.fechas) && p.fechas.length > 0) {
                      const imp = p.fechas.find(
                        (f: any) => !!f.importante && f.fecha,
                      );
                      if (imp && imp.fecha) {
                        picked = {
                          fecha: imp.fecha ?? null,
                          tipoNombre:
                            (imp as any).tipoFechaProceso?.nombre ??
                            (imp as any)['tipo_fecha_proceso']?.nombre ??
                            null,
                        };
                      }
                    }
                  } catch {
                    picked = null;
                  }
                  if (!picked) picked = pickFechaFromProceso(p);
                  return (
                    <>
                      <td className="px-4 py-3 border align-top text-gray-800">
                        {picked.tipoNombre ?? '-'}
                      </td>
                      <td className="px-4 py-3 border align-top text-gray-800">
                        {picked.fecha ? formatFecha(picked.fecha) : '-'}
                      </td>
                      <td className="px-4 py-3 border align-top text-gray-800">
                        {remainingTime(picked.fecha)}
                      </td>
                    </>
                  );
                })()}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
