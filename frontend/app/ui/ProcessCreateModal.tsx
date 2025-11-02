'use client';

import React, { useEffect, useState } from 'react';
import Button from './Button';
import { extractCodigoFromUrl } from '../utils/url';
import { MESSAGES } from '@/app/utils/messages';
import { useRouter } from 'next/navigation';

type Process = { id?: number; ID?: number; [key: string]: unknown };

type Props = {
  open: boolean;
  // Nombres en estilo Server Action (o callbacks de cliente cuando se usan
  // únicamente en el cliente).
  onCloseAction?: () => void;
  onCreatedAction?: (item: Process) => void;
};

type Opt = { id: number; nombre?: string };

export default function ProcessCreateModal(props: Props) {
  const { open } = props;
  // Compatibilidad en tiempo de ejecución: preferir props con sufijo "Action"
  // (convención de Server Actions) pero retroceder a los nombres legados si
  // el llamador en cliente los proporcionó. Nombres legados conservados por
  // compatibilidad hacia atrás.
  type LegacyProps = {
    onClose?: () => void;
    onCreated?: (item: Process) => void;
  };
  const legacy = props as unknown as LegacyProps;
  const onClose = props.onCloseAction ?? legacy.onClose ?? (() => undefined);
  const onCreated =
    props.onCreatedAction ?? legacy.onCreated ?? (() => undefined);
  // Estado del formulario de creación
  const [objeto, setObjeto] = useState('');
  const [entidadId, setEntidadId] = useState<string>('');
  const [anticipo, setAnticipo] = useState<number | ''>('');
  const [mipyme, setMipyme] = useState(false);
  const [estadoId, setEstadoId] = useState<string>('');
  const [tipoProcesoId, setTipoProcesoId] = useState<string>('');
  const [codigoLink, setCodigoLink] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const [entidades, setEntidades] = useState<Opt[]>([]);
  const [estados, setEstados] = useState<Opt[]>([]);
  const [tipos, setTipos] = useState<Opt[]>([]);

  useEffect(() => {
    if (!open) return;
    // Cargar opciones para selects cuando se abre el modal
    (async () => {
      try {
        const base = (
          (process.env.NEXT_PUBLIC_API_BASE as string) ?? ''
        ).replace(/\/$/, '');
        const [eRes, sRes, tRes] = await Promise.all([
          fetch(`${base}/api/entidades`),
          fetch(`${base}/api/estado_proceso`),
          fetch(`${base}/api/tipo_proceso`),
        ]);
        if (eRes.ok) setEntidades(await eRes.json());
        if (sRes.ok) setEstados(await sRes.json());
        if (tRes.ok) setTipos(await tRes.json());
      } catch {
        // ignorar errores de carga de opciones
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) {
      // Resetear campos cuando se cierra el modal
      setObjeto('');
      setEntidadId('');
      setAnticipo('');
      setMipyme(false);
      setEstadoId('');
      setTipoProcesoId('');
      setCodigoLink('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  // Manejar envío del formulario: validación en cliente + POST a /api/procesos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    // validación en el cliente
    const fe: Record<string, string> = {};
    if (!(objeto || '').trim()) fe.objeto = 'Objeto es obligatorio';
    if (anticipo !== '') {
      const n = Number(anticipo);
      if (Number.isNaN(n) || n < 0 || n > 50)
        fe.anticipo = 'Anticipo debe estar entre 0 y 50';
      else if (!Number.isInteger(n))
        fe.anticipo = 'Anticipo debe ser un número entero (sin decimales)';
    }
    if (codigoLink) {
      // exigir dominio SECOP y presencia del token de aviso
      let urlObj: URL | null = null;
      try {
        urlObj = new URL(codigoLink);
      } catch {
        try {
          urlObj = new URL('https://' + codigoLink);
        } catch {
          // ignorar errores de parsing/ruteo
        }
      }
      if (!urlObj) {
        fe.codigoLink = MESSAGES.codigoLink.invalidFormat;
      } else if (
        !String(urlObj.hostname).toLowerCase().includes('secop.gov.co')
      ) {
        fe.codigoLink = MESSAGES.codigoLink.invalidDomain;
      } else {
        const token = extractCodigoFromUrl(codigoLink);
        if (!token) fe.codigoLink = MESSAGES.codigoLink.noNotice;
      }
    }
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }
    setLoading(true);
    try {
      const extracted = extractCodigoFromUrl(codigoLink);
      const payload: Record<string, unknown> = {
        objeto: objeto || undefined,
        mipyme: mipyme || undefined,
        codigoLink: extracted || undefined,
      };
      if (entidadId) payload.entidadId = Number(entidadId);
      if (anticipo !== '') payload.anticipo = Number(anticipo);
      if (estadoId) payload.estadoId = Number(estadoId);
      if (tipoProcesoId) payload.tipoProcesoId = Number(tipoProcesoId);

      const base = ((process.env.NEXT_PUBLIC_API_BASE as string) ?? '').replace(
        /\/$/,
        '',
      );
      const res = await fetch(`${base}/api/procesos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as Process;
      onCreated(data);
      // Redirigir a la página del nuevo proceso
      try {
        const maybeId = data.id ?? data.ID;
        if (maybeId !== undefined && maybeId !== null) {
          const idNum = typeof maybeId === 'number' ? maybeId : Number(maybeId);
          if (!Number.isNaN(idNum)) router.push(`/procesos/${idNum}`);
        }
      } catch {
        // ignorar errores de enrutamiento
      }
    } catch (err: unknown) {
      // normalizar errores desconocidos
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: unknown }).message)
          : String(err);
      setError(msg || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 sm:px-6 lg:px-8">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 z-10"
      >
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          Crear proceso
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 text-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Objeto
            </label>
            <input
              value={objeto}
              onChange={(e) => setObjeto(e.target.value)}
              className={`mt-1 block w-full border px-3 py-2 rounded-md shadow-sm text-gray-900 ${fieldErrors.objeto ? 'border-red-600 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
              placeholder="Ingrese nombre del objeto"
            />
            {fieldErrors.objeto && (
              <div className="mt-1 text-sm text-red-600">
                {fieldErrors.objeto}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {' '}
              Link secop
            </label>
            <input
              value={codigoLink}
              onChange={(e) => setCodigoLink(e.target.value)}
              className={`mt-1 block w-full border px-3 py-2 rounded-md shadow-sm text-gray-900 ${fieldErrors.codigoLink ? 'border-red-600 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
              placeholder="Ingrese el link"
            />
            {fieldErrors.codigoLink && (
              <div className="mt-1 text-sm text-red-600">
                {fieldErrors.codigoLink}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Entidad
            </label>
            <select
              value={entidadId}
              onChange={(e) => setEntidadId(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm text-gray-900 border ${fieldErrors.entidad ? 'border-red-600 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
            >
              <option value="">(Ninguna)</option>
              {entidades.map((en) => (
                <option key={en.id} value={String(en.id)}>
                  {en.nombre ?? String(en.id)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de proceso
            </label>
            <select
              value={tipoProcesoId}
              onChange={(e) => setTipoProcesoId(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm text-gray-900 border ${fieldErrors.tipoProceso ? 'border-red-600 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
            >
              <option value="">(Ninguno)</option>
              {tipos.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nombre ?? String(t.id)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              value={estadoId}
              onChange={(e) => setEstadoId(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm text-gray-900 border ${fieldErrors.estado ? 'border-red-600 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
            >
              <option value="">(Ninguno)</option>
              {estados.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.nombre ?? String(s.id)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Anticipo (%)
            </label>
            <input
              type="number"
              step={1}
              value={anticipo === '' ? '' : anticipo}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') return setAnticipo('');
                const n = Number(raw);
                if (Number.isNaN(n)) return setAnticipo('');
                const intval = Math.trunc(n);
                const clamped = Math.max(0, Math.min(50, intval));
                setAnticipo(clamped);
              }}
              className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm text-gray-900 border ${fieldErrors.anticipo ? 'border-red-600 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
              min={0}
              max={50}
            />
            {fieldErrors.anticipo && (
              <div className="mt-1 text-sm text-red-600">
                {fieldErrors.anticipo}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="mipyme"
              type="checkbox"
              checked={mipyme}
              onChange={(e) => setMipyme(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="mipyme" className="text-sm text-gray-700">
              Mipyme
            </label>
          </div>
        </div>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Crear proceso
          </Button>
        </div>
      </form>
    </div>
  );
}
