'use client';

// -----------------------------------------------------------------------------
// Página: editor/ver proceso
// Propósito: Mostrar y editar un proceso, sus relaciones (entidad, estado, tipo),
// fechas, lotes y ofertas. Este archivo contiene:
// - Imports
// - Tipos locales
// - Estado local (useState)
// - Helpers (funciones pequeñas)
// - Componentes locales reutilizables (RelationEditor, FechaForm)
// - Efectos (fetch inicial, listas relacionadas, teclado global)
// - Handlers CRUD para fechas, lotes y ofertas
// - Renderización del UI (secciones: objeto, entidad, fechas, lotes, ofertas)
// NOTA: Solo se agregaron comentarios y reordenamientos menores; la lógica se
// mantiene sin cambios.
// -----------------------------------------------------------------------------

import React, { useEffect, useRef, useState, useCallback } from 'react';

// RelationEditor movido a nivel de módulo para que React mantenga una identidad
// de componente estable y evite desmontarlo/remontarlo cuando el componente
// padre vuelva a renderizar.
const RelationEditor = React.memo(function RelationEditor({
  field,
  list,
  display,
  setDisplay,
  query,
  setQuery,
  selected,
  setSelected,
  refEl,
  placeholder,
  createKind,
  // injected dependencies from parent
  saving,
  fieldErrors,
  setDraft,
  saveField,
  cancelEdit,
  creatingOption,
  setCreatingOption,
  createOption,
}: any) {
  // logs de depuración eliminados
  return (
    <div ref={refEl} className="flex flex-col gap-2">
      <input
        disabled={saving}
        value={display}
        onChange={(e) => {
          const v = e.target.value;
          setDisplay(v);
          setQuery(v);
          const match = (list || []).find(
            (it: any) =>
              String(it.nombre ?? '')
                .toLowerCase()
                .trim() ===
              String(v ?? '')
                .toLowerCase()
                .trim(),
          );
          if (match) {
            setSelected(match.id);
            setDraft((d: any) => ({ ...d, [field]: match.id }));
          } else {
            setSelected(null);
            setDraft((d: any) => ({ ...d, [field]: null }));
          }
        }}
        placeholder={placeholder}
        className={`border px-2 py-1 rounded ${fieldErrors?.[field] ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancelEdit();
        }}
      />
      <div className="border rounded max-h-40 overflow-auto bg-white">
        {list
          .filter((it: any) =>
            query
              ? (it.nombre ?? '').toLowerCase().includes(query.toLowerCase())
              : true,
          )
          .map((it: any) => (
            <div
              key={it.id}
              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setDraft((d: any) => ({ ...d, [field]: it.id }));
                setDisplay(it.nombre ?? String(it.id));
                setQuery('');
                setSelected(it.id);
              }}
            >
              {it.nombre ?? it.id}
            </div>
          ))}
        {list.length === 0 && (
          <div className="px-2 py-1 text-gray-500">
            Sin {placeholder?.split(' ')[2] ?? 'opciones'}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={async () => {
            try {
              await saveField(field);
            } catch {
              // saveField sets fieldErrors; swallow
            }
          }}
          loading={saving}
          aria-disabled={selected == null}
          disabledTooltip={`Seleccione ${placeholder.split(' ')[2] ?? 'una opción'} y haga clic en la lista para habilitar`}
        >
          Guardar
        </Button>
        <Button variant="secondary" onClick={cancelEdit}>
          Cancelar
        </Button>
      </div>
      {fieldErrors?.[field] && (
        <div className="text-red-600 text-sm">{fieldErrors[field]}</div>
      )}
      <div className="mt-2 flex gap-2 items-center">
        <input
          placeholder={`Crear nuevo ${createKind}`}
          value={creatingOption?.kind === createKind ? creatingOption.name : ''}
          autoFocus={creatingOption?.kind === createKind}
          onChange={(e) =>
            setCreatingOption((s: any) => ({
              ...(s || {}),
              kind: createKind,
              name: e.target.value,
            }))
          }
          className="border px-2 py-1 rounded mr-2"
        />
        <Button
          variant="ghost"
          onClick={async () => {
            await createOption(createKind);
          }}
        >
          Crear
        </Button>
      </div>
    </div>
  );
});
import { useParams } from 'next/navigation';
import Button from '@/app/ui/Button';
import ConfirmModal from '@/app/ui/ConfirmModal';
import DatePicker from '@/app/ui/DatePicker';
import {
  pickFechaFromProceso,
  remainingTime,
  formatFecha,
  isoToDateAndTime,
  combineDateAndTimeToISO,
} from '@/app/utils/tiempo';
import { extractCodigoFromUrl } from '@/app/utils/url';
import { MESSAGES } from '@/app/utils/messages';
import {
  normalizeDecimalInput,
  validateDecimalPrecision,
  formatWithCommaDecimal,
  formatForDisplay,
} from '@/app/utils/number';

type Proceso = any;

export default function Page() {
  const params = useParams();
  const id = params?.id as string | undefined;
  // Nota: evitar retornos tempranos aquí para que los hooks siempre se declaren
  // en el mismo orden. El efecto inicial de carga de datos abajo saldrá temprano
  // cuando `id` no esté presente.
  // Estado principal de la página
  // `proceso`: objeto cargado desde la API para el id actual
  const [proceso, setProceso] = useState<Proceso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado UI de edición: qué campo está en modo edición (por ejemplo 'objeto', 'entidad', ...)
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldSuccess, setFieldSuccess] = useState<Record<string, boolean>>({});
  const [entidades, setEntidades] = useState<Array<any>>([]);
  const [estados, setEstados] = useState<Array<any>>([]);
  const [tipos, setTipos] = useState<Array<any>>([]);
  const [consorciosList, setConsorciosList] = useState<Array<any>>([]);
  const [tipoFechas, setTipoFechas] = useState<Array<any>>([]);
  // -------------------------
  // Estado relativo a Fechas (crear/editar)
  // -------------------------
  const [creatingFecha, setCreatingFecha] = useState(false);
  const [newFechaDraft, setNewFechaDraft] = useState<{
    tipoId?: number | string;
    fechaDate?: string;
    fechaTime?: string;
    importante?: boolean;
  }>({});
  const [fechaErrors, setFechaErrors] = useState<Record<string, string>>({});
  const [newFechaAttemptSave, setNewFechaAttemptSave] = useState(false);
  const [fechaAttemptSave, setFechaAttemptSave] = useState<
    Record<string, boolean>
  >({});
  const [editingFechaId, setEditingFechaId] = useState<number | string | null>(
    null,
  );
  const [fechaEdits, setFechaEdits] = useState<
    Record<
      string,
      {
        tipoId?: number | string;
        fechaDate?: string;
        fechaTime?: string;
        importante?: boolean;
      }
    >
  >({});
  const [creatingOption, setCreatingOption] = useState<{
    kind: 'entidad' | 'estado' | 'tipo' | 'oferta' | 'consorcio' | null;
    name: string;
  }>({ kind: null, name: '' });
  // -------------------------
  // Estado temporal para creación de consorcio dentro del formulario de oferta
  // (mantener valor mientras el form está abierto y evitar que otros effects lo reemplacen)
  // -------------------------
  const [newConsorcioName, setNewConsorcioName] = useState('');
  // oferta editing state
  const [editingOfertaId, setEditingOfertaId] = useState<number | null>(null);
  const [ofertaEdits, setOfertaEdits] = useState<
    Record<string, { consorcioId?: number | null }>
  >({});
  const [ofertaAttemptSave, setOfertaAttemptSave] = useState<
    Record<string, boolean>
  >({});

  const createOferta = async (consorcioId: number | null, loteId: number) => {
    // Guardia del lado del cliente: requerir la selección de un consorcio antes de intentar crear
    if (consorcioId == null) {
      // mark attempted save for the target lote so validation UI appears
      try {
        setNewOfertaAttemptSave((s) => ({
          ...(s || {}),
          [String(loteId)]: true,
        }));
      } catch {}
      showToast('Seleccione un consorcio antes de crear la oferta', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload: any = { consorcioId: Number(consorcioId), loteId };
      const res = await fetch(`${getApiBase()}/api/ofertas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        throw new Error(txt || 'Error creando oferta');
      }
      let data = await res.json().catch(() => undefined);
      if (!data) {
        const loc = res.headers.get('location') || res.headers.get('Location');
        if (loc) {
          try {
            const r2 = await fetch(loc);
            if (r2.ok) data = await r2.json().catch(() => undefined);
          } catch {}
        }
      }
      if (data) {
        const normalized = {
          id: data.id ?? data.ID ?? data._id,
          consorcio:
            data.consorcio ??
            (data.consorcioId ? { id: data.consorcioId } : undefined),
          lote: data.lote ?? (data.loteId ? { id: data.loteId } : undefined),
          ...data,
        };
        setProceso((p: any) =>
          p
            ? {
                ...p,
                lotes: (p.lotes || []).map((lo: any) =>
                  lo.id === loteId
                    ? { ...lo, ofertas: [normalized, ...(lo.ofertas || [])] }
                    : lo,
                ),
              }
            : p,
        );
      }
      await refetchProceso();
      // close the create-offer UI and reset draft/attempt flags
      try {
        setCreatingOption({ kind: null, name: '' });
      } catch {}
      try {
        setNewOfertaDraft({});
      } catch {}
      try {
        setNewOfertaAttemptSave((s) => {
          const c = { ...(s || {}) } as Record<string, boolean>;
          delete c[String(loteId)];
          return c;
        });
      } catch {}
      showToast('Oferta creada', 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
      showToast('Error creando oferta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEditOferta = (of: any) => {
    setEditingOfertaId(of.id ?? null);
    setOfertaEdits((s) => ({
      ...s,
      [String(of.id)]: { consorcioId: of.consorcio?.id ?? null },
    }));
    setOfertaAttemptSave((s) => ({ ...s, [String(of.id)]: false }));
  };

  const cancelEditOferta = (id?: number | null) => {
    if (id != null)
      setOfertaEdits((s) => {
        const c = { ...s };
        delete c[String(id)];
        return c;
      });
    setEditingOfertaId(null);
    if (id != null)
      setOfertaAttemptSave((s) => {
        const c = { ...s };
        delete c[String(id)];
        return c;
      });
  };

  const saveOferta = async (id: number) => {
    const draft = ofertaEdits[String(id)];
    if (!draft) return;
    // mark attempt so validation messages display
    setOfertaAttemptSave((s) => ({ ...s, [String(id)]: true }));
    try {
      setSaving(true);
      const payload: any = {};
      if (draft.consorcioId != null)
        payload.consorcioId = Number(draft.consorcioId);
      const res = await fetch(`/api/ofertas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        throw new Error(txt || 'Error actualizando oferta');
      }
      await refetchProceso();
      cancelEditOferta(id);
      showToast('Oferta actualizada', 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
      showToast('Error actualizando oferta', 'error');
    } finally {
      setSaving(false);
    }
  };
  // notificaciones (toast)
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // estado de combobox para selects
  const [entidadQuery, setEntidadQuery] = useState('');
  const [tipoQuery, setTipoQuery] = useState('');
  const [estadoQuery, setEstadoQuery] = useState('');
  const [entidadDisplay, setEntidadDisplay] = useState('');
  const [tipoDisplay, setTipoDisplay] = useState('');
  const [estadoDisplay, setEstadoDisplay] = useState('');
  // rastrea si el usuario realmente seleccionó una opción (click) para habilitar Guardar
  const [entidadSelected, setEntidadSelected] = useState<
    number | string | null
  >(null);
  const [tipoSelected, setTipoSelected] = useState<number | string | null>(
    null,
  );
  const [estadoSelected, setEstadoSelected] = useState<number | string | null>(
    null,
  );
  const entidadRef = useRef<HTMLDivElement | null>(null);
  const tipoRef = useRef<HTMLDivElement | null>(null);
  const estadoRef = useRef<HTMLDivElement | null>(null);

  // -------------------------
  // Helpers pequeños y utilidades locales
  // -------------------------
  // getApiBase: retorna la base de la API (sin slash final)
  const getApiBase = () =>
    ((process.env.NEXT_PUBLIC_API_BASE as string) ?? '').replace(/\/$/, '');

  // Cargar la lista de consorcios (usada en el montaje y al abrir el formulario de crear oferta)
  const loadConsorcios = useCallback(async () => {
    try {
      const r = await fetch(`${getApiBase()}/api/consorcios`);
      if (r.ok) setConsorciosList(await r.json());
    } catch {
      // ignore
    }
  }, []);

  const idOf = (v: any) => {
    if (v == null) return null;
    if (typeof v === 'object') return v.id ?? v.ID ?? v._id ?? v.value ?? v;
    return v;
  };

  const getDisplayName = (val: any, list: Array<any>, fallback?: string) => {
    if (val === undefined || val === null) return fallback ?? '-';
    if (typeof val === 'object')
      return val.nombre ?? String(val.id ?? fallback ?? '-');
    const found = (list || []).find((x: any) => String(x.id) === String(val));
    return found ? found.nombre : String(val);
  };
  // RelationEditor: moved to module-level as a stable component so React doesn't
  // remount it on every parent render (this was causing focus/caret loss while typing).
  // The real implementation is declared at module scope below `imports` so it keeps
  // a stable identity across renders. Here we just reference that component.

  // Formulario local para crear/editar una fecha
  // Props principales:
  // - draft: datos actuales (tipoId, fechaDate, fechaTime, importante)
  // - changeDraft(mark): función para aplicar cambios parciales al draft
  // - attemptSave / markAttempt: flags para mostrar validación sólo tras intentar guardar
  // - onSave / onCancel / onDelete: handlers para acciones del formulario
  // - tipoFechas: lista de tipos disponibles
  // - saving: indicador global de guardado
  // - isNew: true cuando es creación, false cuando es edición
  const FechaForm = ({
    draft,
    changeDraft,
    attemptSave,
    markAttempt,
    error,
    onSave,
    onCancel,
    onDelete,
    tipoFechas,
    saving,
    isNew,
  }: any) => {
    const canSave = Boolean(
      draft?.tipoId && draft?.fechaDate && draft?.fechaTime,
    );
    // Date selection is handled by the shared DatePicker component

    return (
      <div className="flex flex-col gap-2">
        <select
          value={draft?.tipoId ?? ''}
          onChange={(e) => changeDraft({ tipoId: e.target.value })}
          className={`border px-2 py-1 rounded ${!draft?.tipoId && attemptSave ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
        >
          <option value="" disabled>
            Seleccione tipo
          </option>
          {tipoFechas.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        {!draft?.tipoId && attemptSave && (
          <div className="text-red-600 text-sm">Seleccione un tipo</div>
        )}
        <div className="flex gap-2">
          <div>
            <DatePicker
              value={draft?.fechaDate ?? ''}
              onChangeAction={(v: string) => changeDraft({ fechaDate: v })}
              className={`border px-2 py-1 rounded ${!draft?.fechaDate && attemptSave ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
              placeholder="Selecciona fecha"
            />
          </div>
          <input
            type="time"
            step={60}
            className={`border px-2 py-1 rounded ${!draft?.fechaTime && attemptSave ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
            value={draft?.fechaTime ?? ''}
            onChange={(e) => changeDraft({ fechaTime: e.target.value })}
            onFocus={() => {
              if (!draft?.fechaTime) changeDraft({ fechaTime: '07:00' });
            }}
            onClick={() => {
              if (!draft?.fechaTime) changeDraft({ fechaTime: '07:00' });
            }}
          />
        </div>
        {!draft?.fechaDate && attemptSave && (
          <div className="text-red-600 text-sm">Seleccione una fecha</div>
        )}
        {!draft?.fechaTime && attemptSave && (
          <div className="text-red-600 text-sm">Seleccione una hora</div>
        )}
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!draft?.importante}
            onChange={(e) => changeDraft({ importante: e.target.checked })}
          />
          <span className="text-sm">Importante</span>
        </label>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              markAttempt();
              onSave();
            }}
            loading={saving}
            aria-disabled={!canSave}
            disabledTooltip={
              isNew
                ? 'Seleccione tipo, fecha y hora para habilitar'
                : 'Seleccione tipo, fecha y hora para habilitar'
            }
          >
            {isNew ? 'Crear fecha' : 'Guardar'}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          {!isNew && (
            <Button variant="danger" onClick={onDelete}>
              Eliminar
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Efecto: cargar el proceso inicial por id
  useEffect(() => {
    let mounted = true;
    const fetchProceso = async () => {
      const url = `${getApiBase()}/api/procesos?id=${id}`;
      setLoading(true);
      setError(null);
      setProceso(null);
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text().catch(() => undefined);
          throw new Error(
            `HTTP ${res.status} when fetching ${url}: ${text ?? ''}`,
          );
        }
        const data = await res.json();
        if (!mounted) return;
        setProceso(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? String(e));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchProceso();

    return () => {
      mounted = false;
    };
  }, [id]);

  // helper para volver a obtener (re-fetch) el proceso bajo demanda (usado después de PATCH)
  const refetchProceso = async () => {
    try {
      const url = `${getApiBase()}/api/procesos?id=${id}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setProceso(data);
    } catch {
      // ignore
    }
  };

  // Efecto: cargar listas usadas por los select/autocomplete (entidades, estados, tipos, tipo_fechas)
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [eRes, sRes, tRes, tfRes] = await Promise.all([
          fetch(`${getApiBase()}/api/entidades`),
          fetch(`${getApiBase()}/api/estado_proceso`),
          fetch(`${getApiBase()}/api/tipo_proceso`),
          fetch(`${getApiBase()}/api/tipo_fecha_proceso`),
        ]);
        if (eRes.ok) setEntidades(await eRes.json());
        if (sRes.ok) setEstados(await sRes.json());
        if (tRes.ok) setTipos(await tRes.json());
        if (tfRes.ok) setTipoFechas(await tfRes.json());
      } catch {
        // ignore
      }
    })();
  }, [id]);

  // Efecto: cargar lista de consorcios (usada en formularios de oferta)
  useEffect(() => {
    loadConsorcios();
  }, [loadConsorcios]);

  // Handler global de teclado: Esc cancela la edición actual
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelEdit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startEdit = (field: string) => {
    setEditing(field);
    // Inicializar el draft con valores primitivos sensatos (ids/strings) para evitar poner objetos dentro de los inputs
    const getValue = () => {
      // relaciones
      if (field === 'entidad')
        return proceso.entidad ? (proceso.entidad.id ?? proceso.entidad) : '';
      if (field === 'estado')
        return proceso.estado ? (proceso.estado.id ?? proceso.estado) : '';
      if (field === 'tipoProceso' || field === 'tipo_proceso')
        return proceso.tipoProceso
          ? (proceso.tipoProceso.id ??
              proceso.tipo_proceso ??
              proceso.tipoProceso)
          : (proceso.tipo_proceso ?? '');
      if (field === 'codigoLink')
        return proceso.codigoLink ?? proceso.codigo_link ?? '';
      // fallback a la propiedad directa o la variante en snake_case
      return (
        (proceso as any)?.[field] ??
        (proceso as any)?.[field.replace(/([A-Z])/g, '_$1').toLowerCase()] ??
        ''
      );
    };
    const val = getValue();
    setDraft((p: any) => ({ ...(p || {}), [field]: val }));
    // inicializar la query del combobox con el nombre legible al editar relaciones
    if (field === 'entidad') {
      const idVal = proceso.entidad
        ? typeof proceso.entidad === 'object'
          ? (proceso.entidad.id ?? proceso.entidad)
          : proceso.entidad
        : null;
      const name = proceso.entidad
        ? typeof proceso.entidad === 'object'
          ? (proceso.entidad.nombre ?? String(proceso.entidad.id))
          : (entidades.find((e) => String(e.id) === String(proceso.entidad))
              ?.nombre ?? String(proceso.entidad))
        : '';
      setEntidadDisplay(name);
      setEntidadQuery('');
      setEntidadSelected(idVal ?? null);
      // ensure draft contains current selection so saveField works if user doesn't change selection
      setDraft((d: any) => ({ ...d, entidad: idVal ?? null }));
    }
    if (field === 'tipoProceso') {
      const valTipo = proceso.tipoProceso ?? proceso.tipo_proceso;
      const idVal = valTipo
        ? typeof valTipo === 'object'
          ? (valTipo.id ?? valTipo)
          : valTipo
        : null;
      const name = valTipo
        ? typeof valTipo === 'object'
          ? (valTipo.nombre ?? String(valTipo.id))
          : (tipos.find((t) => String(t.id) === String(valTipo))?.nombre ??
            String(valTipo))
        : '';
      setTipoDisplay(name);
      setTipoQuery('');
      setTipoSelected(idVal ?? null);
      setDraft((d: any) => ({ ...d, tipoProceso: idVal ?? null }));
    }
    if (field === 'estado') {
      const idVal = proceso.estado
        ? typeof proceso.estado === 'object'
          ? (proceso.estado.id ?? proceso.estado)
          : proceso.estado
        : null;
      const name = proceso.estado
        ? typeof proceso.estado === 'object'
          ? (proceso.estado.nombre ?? String(proceso.estado.id))
          : (estados.find((s) => String(s.id) === String(proceso.estado))
              ?.nombre ?? String(proceso.estado))
        : '';
      setEstadoDisplay(name);
      setEstadoQuery('');
      setEstadoSelected(idVal ?? null);
      setDraft((d: any) => ({ ...d, estado: idVal ?? null }));
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft({});
  };

  const saveField = async (
    field: string,
    opts?: { closeAfterSave?: boolean; valueOverride?: any },
  ) => {
    if (!proceso) return;
    // client-side validation
    setFieldErrors((s) => ({ ...s, [field]: '' }));
    setError(null);
    if (field === 'objeto') {
      if (!draft.objeto || String(draft.objeto).trim() === '') {
        setFieldErrors((s) => ({ ...s, objeto: 'Objeto es obligatorio' }));
        return;
      }
    }
    if (field === 'anticipo') {
      // make anticipo required when editing
      if (draft.anticipo === '' || draft.anticipo == null) {
        setFieldErrors((s) => ({ ...s, anticipo: 'Anticipo es obligatorio' }));
        return;
      }
      const val = Number(draft.anticipo);
      if (isNaN(val) || val < 0 || val > 50) {
        setFieldErrors((s) => ({
          ...s,
          anticipo: 'Anticipo debe ser un número entre 0 y 50',
        }));
        return;
      }
      if (!Number.isInteger(val)) {
        setFieldErrors((s) => ({
          ...s,
          anticipo: 'Anticipo debe ser un número entero (sin decimales)',
        }));
        return;
      }
    }

    // Para codigoLink requerimos que el usuario pegue un enlace de SECOP (no texto arbitrario).
    // Validamos temprano para mostrar el error en línea sin iniciar el spinner de guardado.
    if (field === 'codigoLink') {
      const rawInput =
        opts?.valueOverride !== undefined ? opts.valueOverride : draft[field];
      const s = rawInput == null ? '' : String(rawInput).trim();
      if (!s) {
        setFieldErrors((x) => ({
          ...x,
          codigoLink: 'El enlace no puede estar vacío',
        }));
        return;
      }
      // Intentar parsear la URL (permitir esquema faltante)
      let urlObj: URL | null = null;
      try {
        urlObj = new URL(s);
      } catch {
        try {
          urlObj = new URL('https://' + s);
        } catch {
          urlObj = null;
        }
      }
      if (!urlObj) {
        setFieldErrors((x) => ({
          ...x,
          codigoLink:
            'Pegue un enlace válido de SECOP (ej. https://www.secop.gov.co/...)',
        }));
        return;
      }
      const host = (urlObj.hostname || '').toLowerCase();
      if (!host.includes('secop.gov.co')) {
        setFieldErrors((x) => ({
          ...x,
          codigoLink: 'El enlace debe ser del dominio secop.gov.co',
        }));
        return;
      }
      const token = extractCodigoFromUrl(s);
      if (!token) {
        setFieldErrors((x) => ({
          ...x,
          codigoLink: 'No se encontró un código "notice" válido en el enlace',
        }));
        return;
      }
    }

    // additional client-side required validations for relations
    const value =
      opts?.valueOverride !== undefined ? opts.valueOverride : draft[field];
    const unboxed = idOf(value);
    if (
      field === 'entidad' &&
      (unboxed == null || String(unboxed).trim() === '')
    ) {
      setFieldErrors((s) => ({ ...s, entidad: 'Seleccione una entidad' }));
      return;
    }
    if (
      field === 'estado' &&
      (unboxed == null || String(unboxed).trim() === '')
    ) {
      setFieldErrors((s) => ({ ...s, estado: 'Seleccione un estado' }));
      return;
    }
    if (
      (field === 'tipoProceso' || field === 'tipo_proceso') &&
      (unboxed == null || String(unboxed).trim() === '')
    ) {
      setFieldErrors((s) => ({
        ...s,
        tipoProceso: 'Seleccione un tipo de proceso',
      }));
      return;
    }

    setSaving(true);
    try {
      // Mapear nombres de campo amigables a las claves del payload de la API
      const payload: any = {};
      if (field === 'entidad')
        payload.entidadId = unboxed ? Number(unboxed) : null;
      else if (field === 'estado')
        payload.estadoId = unboxed ? Number(unboxed) : null;
      else if (field === 'tipoProceso' || field === 'tipo_proceso')
        payload.tipoProcesoId = unboxed ? Number(unboxed) : null;
      else if (field === 'codigoLink')
        payload.codigoLink = extractCodigoFromUrl(value) ?? null;
      else payload[field] = unboxed;

      const res = await fetch(`/api/procesos?id=${proceso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        // show inline error for this field when possible
        setFieldErrors((s) => ({
          ...s,
          [field]: txt || `${res.status} ${res.statusText}`,
        }));
        throw new Error(txt || `${res.status} ${res.statusText}`);
      }
      // After a PATCH many APIs return a partial object (or only the changed fields).
      // To avoid losing other fields and relations, re-fetch the full recurso.
      await refetchProceso();
      const close = opts?.closeAfterSave !== false; // default true
      if (close) {
        setEditing(null);
        setDraft({});
      }
      // show transient success
      setFieldSuccess((s) => ({ ...s, [field]: true }));
      setTimeout(
        () => setFieldSuccess((s) => ({ ...s, [field]: false })),
        2000,
      );
    } catch (e: any) {
      // global fallback error
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const createOption = async (
    kind: 'entidad' | 'estado' | 'tipo' | 'consorcio',
    explicitName?: string,
  ) => {
    const nameToUse =
      kind === 'consorcio'
        ? (explicitName ?? creatingOption.name)
        : creatingOption.name;
    if (!nameToUse || !String(nameToUse).trim()) return;
    try {
      const endpoint =
        kind === 'entidad'
          ? '/api/entidades'
          : kind === 'estado'
            ? '/api/estado_proceso'
            : kind === 'tipo'
              ? '/api/tipo_proceso'
              : '/api/consorcios';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: String(nameToUse).trim() }),
      });
      if (!res.ok) throw new Error('No se pudo crear');
      const data = await res.json().catch(() => undefined);
      // normalizar el recurso creado a { id, nombre }
      let createdId: string | number | undefined = undefined;
      let createdName: string | undefined = undefined;
      if (data != null && typeof data === 'object') {
        createdId =
          data.id ?? data.ID ?? data._id ?? data.Id ?? data.key ?? undefined;
        createdName =
          data.nombre ??
          data.name ??
          data.title ??
          data.nombre_entidad ??
          undefined;
      } else if (typeof data === 'number' || typeof data === 'string') {
        createdId = data;
      }
      // fallback: usar el nombre que el usuario escribió
      if (!createdName) createdName = creatingOption.name.trim();
      // si el servidor no devolvió un id, intentar parsear la cabecera Location u otro (mejor esfuerzo)
      if (createdId == null) {
        // attempt to read Location header containing an id at the end
        const location =
          res.headers.get('location') || res.headers.get('Location');
        if (location) {
          const m = location.match(/\/(\d+)(?:$|\/)/);
          if (m) createdId = Number(m[1]);
        }
      }

      // construir un item normalizado
      const item = { id: createdId ?? createdName, nombre: createdName };

      if (kind === 'entidad') {
        setEntidades((s) => [item, ...(s || [])]);
        setEntidadQuery(item.nombre ?? String(item.id));
        // set as selected in draft and optimistic proceso update so UI reflects selection immediately
        setDraft((d: any) => ({ ...(d || {}), entidad: item.id }));
        setProceso((p: any) => (p ? { ...p, entidad: item } : p));
      }
      if (kind === 'estado') {
        setEstados((s) => [item, ...(s || [])]);
        setEstadoQuery(item.nombre ?? String(item.id));
        setDraft((d: any) => ({ ...(d || {}), estado: item.id }));
        setProceso((p: any) => (p ? { ...p, estado: item } : p));
      }
      if (kind === 'tipo') {
        setTipos((s) => [item, ...(s || [])]);
        setTipoQuery(item.nombre ?? String(item.id));
        setDraft((d: any) => ({ ...(d || {}), tipoProceso: item.id }));
        setProceso((p: any) => (p ? { ...p, tipoProceso: item } : p));
      }
      if (kind === 'consorcio') {
        // for consorcios we only update the consorcios list and select it for the new oferta draft
        setConsorciosList((s) => [item, ...(s || [])]);
        setNewOfertaDraft((d: any) => ({ ...(d || {}), consorcioId: item.id }));
        setCreatingOption({ kind: null, name: '' });
        setNewConsorcioName('');
        // ensure proceso.consorcios is fresh so the select inside proceso shows the new consorcio
        try {
          await refetchProceso();
        } catch {}
        // if the oferta form was open and we have a loteId, create the oferta automatically
        try {
          const loteId =
            newOfertaDraft && (newOfertaDraft as any).loteId
              ? Number((newOfertaDraft as any).loteId)
              : null;
          if (loteId != null) {
            await createOferta(Number(item.id), loteId);
          }
        } catch {
          // ignore - createOferta handles errors/toasts
        }
        return;
      }
      // clear the creating option for entidad/estado/tipo flows below
      setCreatingOption({ kind: null, name: '' });
      // ensure lists are fresh (in case server assigns different IDs or other metadata)
      await Promise.all([
        (async () => {
          try {
            const r = await fetch(`${getApiBase()}/api/entidades`);
            if (r.ok) setEntidades(await r.json());
          } catch {}
        })(),
        (async () => {
          try {
            const r = await fetch(`${getApiBase()}/api/estado_proceso`);
            if (r.ok) setEstados(await r.json());
          } catch {}
        })(),
        (async () => {
          try {
            const r = await fetch(`${getApiBase()}/api/tipo_proceso`);
            if (r.ok) setTipos(await r.json());
          } catch {}
        })(),
        (async () => {
          try {
            const r = await fetch(`${getApiBase()}/api/consorcios`);
            if (r.ok) setConsorciosList(await r.json());
          } catch {}
        })(),
      ]);
      // persist selection on the proceso and server and close the editor (default behavior)
      // pass the id explicitly to avoid race conditions where draft hasn't updated yet
      await refetchProceso();
      try {
        if (kind === 'entidad') {
          await saveField('entidad', { valueOverride: item.id });
        }
        if (kind === 'estado') {
          await saveField('estado', { valueOverride: item.id });
        }
        if (kind === 'tipo') {
          await saveField('tipoProceso', { valueOverride: item.id });
        }
      } catch {
        // if saveField fails, we already refetched the proceso optimistically; show an error
        // error handling inside saveField will update UI
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  // -------------------------
  // Helpers CRUD para Fechas
  // - createFecha: crea una nueva fecha para este proceso
  // - startEditFecha / cancelEditFecha: preparar estado para editar una fecha
  // - saveFecha: persistir cambios de fecha
  // - deleteFecha: eliminar una fecha
  // -------------------------
  // Fecha CRUD helpers
  const createFecha = async () => {
    if (!proceso) return;
    // mark that user attempted to create a fecha so validation messages display
    setNewFechaAttemptSave(true);

    const tipoId = newFechaDraft.tipoId;
    const parsed = combineDateAndTimeToISO(
      newFechaDraft.fechaDate ?? null,
      newFechaDraft.fechaTime ?? null,
    );
    if (!tipoId) {
      setFechaErrors((s) => ({ ...s, create: 'Seleccione un tipo de fecha' }));
      return;
    }
    if (!parsed) {
      setFechaErrors((s) => ({
        ...s,
        create: 'Fecha inválida. Seleccione fecha y hora',
      }));
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${getApiBase()}/api/fecha_proceso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procesoId: Number(proceso.id),
          tipoFechaProcesoId: Number(tipoId),
          fecha: parsed,
          importante: !!newFechaDraft.importante,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        setFechaErrors((s) => ({
          ...s,
          create: txt || `${res.status} ${res.statusText}`,
        }));
        throw new Error(txt || `${res.status} ${res.statusText}`);
      }
      // intentar leer el recurso creado si fue devuelto
      const created = await res.json().catch(() => undefined);
      // refresh proceso to include created fecha
      await refetchProceso();
      // if user requested importante on creation, ensure server marks only this one as importante
      if ((newFechaDraft as any).importante) {
        try {
          // If server returned the created resource and includes an id, prefer it
          let createdId: string | number | undefined =
            created && (created.id ?? created.ID ?? created._id)
              ? (created.id ?? created.ID ?? created._id)
              : undefined;
          // If we don't have an id, try to locate the created fecha by matching fecha + tipo
          if (!createdId) {
            // find the fecha in the refreshed proceso that matches our payload
            try {
              const parsedIso = combineDateAndTimeToISO(
                newFechaDraft.fechaDate ?? null,
                newFechaDraft.fechaTime ?? null,
              );
              const found = (proceso?.fechas || []).find((f: any) => {
                try {
                  return (
                    String(
                      f.tipoFechaProceso?.id ??
                        f['tipo_fecha_proceso']?.id ??
                        f.tipoFechaProceso ??
                        '',
                    ) === String(newFechaDraft.tipoId) &&
                    String(f.fecha ?? '') === String(parsedIso)
                  );
                } catch {
                  return false;
                }
              });
              if (found && (found.id || found.ID || found._id))
                createdId = found.id ?? found.ID ?? found._id;
            } catch {
              // ignore matching errors
            }
          }

          if (createdId) {
            await fetch(`/api/fecha_proceso/${createdId}/mark-important`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ importante: true }),
            });
            await refetchProceso();
          }
        } catch {
          // ignore errors when trying to mark importante
        }
      }
      setCreatingFecha(false);
      setNewFechaDraft({});
      showToast('Fecha creada', 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const startEditFecha = (f: any) => {
    setEditingFechaId(f.id ?? String(Math.random()));
    // convert stored ISO to separate date and time values
    const parts = isoToDateAndTime(f.fecha ?? null);
    setFechaEdits((s) => ({
      ...s,
      [String(f.id)]: {
        tipoId: f.tipoFechaProceso?.id ?? f['tipo_fecha_proceso']?.id ?? '',
        fechaDate: parts.date ?? '',
        fechaTime: parts.time ?? '',
        importante: !!f.importante,
      },
    }));
  };

  const cancelEditFecha = (id?: number | string) => {
    if (id != null) {
      setFechaEdits((s) => {
        const c = { ...s };
        delete c[String(id)];
        return c;
      });
    }
    setEditingFechaId(null);
  };

  const saveFecha = async (id?: number | string) => {
    if (!proceso) return;
    const key = id == null ? null : String(id);
    const draft = key ? fechaEdits[key] : newFechaDraft;
    const tipoId = draft?.tipoId;
    const parsed = combineDateAndTimeToISO(
      draft?.fechaDate ?? null,
      draft?.fechaTime ?? null,
    );
    // mark that user attempted to save this fecha so validation messages display
    if (key != null)
      setFechaAttemptSave((s) => ({ ...s, [String(key)]: true }));
    else setNewFechaAttemptSave(true);

    if (!tipoId) {
      const target = key != null ? String(key) : 'create';
      setFechaErrors((s) => ({
        ...s,
        [target]: 'Seleccione un tipo de fecha',
      }));
      return;
    }
    if (!parsed) {
      const target = key != null ? String(key) : 'create';
      setFechaErrors((s) => ({
        ...s,
        [target]: 'Fecha inválida. Seleccione fecha y hora válidas',
      }));
      return;
    }
    try {
      setSaving(true);
      if (key == null) {
        // no aplica
      } else {
        const res = await fetch(`/api/fecha_proceso/${key}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipoFechaProcesoId: Number(tipoId),
            fecha: parsed,
            importante: !!draft?.importante,
          }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => undefined);
          setFechaErrors((s) => ({
            ...s,
            [String(key)]: txt || `${res.status} ${res.statusText}`,
          }));
          throw new Error(txt || `${res.status} ${res.statusText}`);
        }
        await refetchProceso();
        // if draft requested importante, ensure server unsets others atomically
        try {
          if (draft?.importante) {
            await fetch(`/api/fecha_proceso/${key}/mark-important`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ importante: true }),
            });
            await refetchProceso();
          }
        } catch {
          /* ignore */
        }
        cancelEditFecha(id);
        showToast('Fecha actualizada', 'success');
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const deleteFecha = async (id: number | string) => {
    if (!proceso) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/fecha_proceso/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        setError(txt || `${res.status} ${res.statusText}`);
        showToast('Error eliminando fecha', 'error');
        throw new Error(txt || `${res.status} ${res.statusText}`);
      }
      await refetchProceso();
      showToast('Fecha eliminada', 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleImportante = async (id: number | string, setTo: boolean) => {
    if (!proceso) return;
    try {
      setSaving(true);
      // optimistic update: mark only the selected one as importante and others false
      setProceso((p: any) => {
        if (!p) return p;
        return {
          ...p,
          fechas: (p.fechas || []).map((ff: any) => ({
            ...ff,
            importante: String(ff.id) === String(id) ? setTo : false,
          })),
        };
      });

      const res = await fetch(`/api/fecha_proceso/${id}/mark-important`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importante: !!setTo }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        throw new Error(txt || `${res.status} ${res.statusText}`);
      }

      // refresh to get authoritative state
      await refetchProceso();
      showToast('Guardado', 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
      showToast('Error', 'error');
      try {
        await refetchProceso();
      } catch {}
    } finally {
      setSaving(false);
    }
  };

  // -------------------------
  // Handlers CRUD para Lotes y sus Ofertas
  // - createLote / startEditLote / saveLote / deleteLote
  // - createOferta / startEditOferta / saveOferta / deleteOferta
  // -------------------------
  // Lotes CRUD state & handlers
  const [creatingLote, setCreatingLote] = useState(false);
  const [newLoteDraft, setNewLoteDraft] = useState<{
    valor?: string;
    poliza?: string;
    poliza_real?: boolean;
  }>({});
  const [newLoteAttemptSave, setNewLoteAttemptSave] = useState(false);
  const [loteErrors, setLoteErrors] = useState<Record<string, string>>({});
  const [editingLoteId, setEditingLoteId] = useState<number | string | null>(
    null,
  );
  const [loteEdits, setLoteEdits] = useState<
    Record<string, { valor?: string; poliza?: string; poliza_real?: boolean }>
  >({});
  const [loteAttemptSave, setLoteAttemptSave] = useState<
    Record<string, boolean>
  >({});
  const [newOfertaDraft, setNewOfertaDraft] = useState<{
    consorcioId?: number | null;
    loteId?: number | null;
  }>({});
  const [newOfertaAttemptSave, setNewOfertaAttemptSave] = useState<
    Record<string, boolean>
  >({});

  const createLote = async () => {
    if (!proceso) return;
    // mark that user attempted to create (so UI shows validation)
    setNewLoteAttemptSave(true);
    // client-side validation
    setLoteErrors((s) => ({ ...s, create: '' }));
    const normalizedValor = normalizeDecimalInput(newLoteDraft.valor ?? null);
    if (!normalizedValor) {
      setLoteErrors((s) => ({
        ...s,
        create: 'Valor inválido o vacío (debe ser numérico)',
      }));
      return;
    }
    if (!validateDecimalPrecision(normalizedValor)) {
      setLoteErrors((s) => ({
        ...s,
        create:
          'Valor excede la precisión permitida (15 dígitos totales, 2 decimales)',
      }));
      return;
    }
    try {
      setSaving(true);
      const payload: any = { procesoId: Number(proceso.id) };
      // format decimals to '123.45' strings
      if (normalizedValor) payload.valor = normalizedValor;
      const normalizedPol = normalizeDecimalInput(newLoteDraft.poliza ?? null);
      if (normalizedPol) {
        if (!validateDecimalPrecision(normalizedPol)) {
          setLoteErrors((s) => ({
            ...s,
            create: 'Póliza excede la precisión permitida',
          }));
          setSaving(false);
          return;
        }
        payload.poliza = normalizedPol;
        payload.poliza_real = true;
      } else {
        // If no póliza provided, compute a synthetic póliza = valor * 0.00013
        // but mark poliza_real as false (it's not a real póliza)
        try {
          const baseVal = Number(normalizedValor);
          if (!Number.isNaN(baseVal)) {
            const synthetic = baseVal * 0.00013;
            const syntheticStr = synthetic.toFixed(2);
            if (validateDecimalPrecision(syntheticStr)) {
              payload.poliza = syntheticStr;
            }
          }
        } catch {
          // ignore synthetic calculation errors
        }
        payload.poliza_real = false;
      }
      const res = await fetch(`${getApiBase()}/api/lotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        setLoteErrors((s) => ({
          ...s,
          create: txt || `${res.status} ${res.statusText}`,
        }));
        throw new Error(txt || `${res.status} ${res.statusText}`);
      }
      await refetchProceso();
      setCreatingLote(false);
      setNewLoteDraft({});
      setNewLoteAttemptSave(false);
      showToast('Lote creado', 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const startEditLote = (l: any) => {
    setEditingLoteId(l.id ?? String(Math.random()));
    // inicializar edits con valores formateados (separador de miles + coma decimal) o strings vacíos para que el usuario pueda escribir decimales
    const stripTrailingZeroCents = (formatted: string) => {
      if (!formatted) return '';
      // if ends with ',00' remove the comma and zeros to simplify editing
      if (formatted.endsWith(',00')) return formatted.slice(0, -3);
      return formatted;
    };
    setLoteEdits((s) => ({
      ...s,
      [String(l.id)]: {
        valor:
          l.valor != null
            ? stripTrailingZeroCents(formatForDisplay(l.valor))
            : '',
        // If poliza_real is false (synthetic), show an empty input so user can add a real póliza
        poliza:
          l.poliza != null && l.poliza_real !== false
            ? stripTrailingZeroCents(formatForDisplay(l.poliza))
            : '',
        poliza_real: !!l.poliza_real,
      },
    }));
    // resetear el flag de intento para este lote al iniciar la edición
    setLoteAttemptSave((s) => ({ ...s, [String(l.id)]: false }));
  };

  const cancelEditLote = (id?: number | string) => {
    if (id != null) {
      setLoteEdits((s) => {
        const c = { ...s };
        delete c[String(id)];
        return c;
      });
    }
    setEditingLoteId(null);
    if (id != null)
      setLoteAttemptSave((s) => {
        const c = { ...s };
        delete c[String(id)];
        return c;
      });
  };

  const saveLote = async (id?: number | string) => {
    if (!proceso) return;
    const key = id == null ? null : String(id);
    const draft = key ? loteEdits[key] : newLoteDraft;
    // client-side validation
    if (!draft) return;
    // marcar que el usuario intentó guardar este lote para que se muestren mensajes de validación
    if (key != null) setLoteAttemptSave((s) => ({ ...s, [String(key)]: true }));
    setLoteErrors((s) => ({ ...s, [String(key)]: '' }));
    if (!draft.valor || String(draft.valor).trim() === '') {
      setLoteErrors((s) => ({ ...s, [String(key)]: 'Valor es obligatorio' }));
      return;
    }
    if (String(draft.valor).length > 32) {
      setLoteErrors((s) => ({
        ...s,
        [String(key)]: 'Valor demasiado largo (máx 32 caracteres)',
      }));
      return;
    }
    if (!/[0-9]/.test(String(draft.valor))) {
      setLoteErrors((s) => ({
        ...s,
        [String(key)]: 'Valor debe contener números',
      }));
      return;
    }
    try {
      setSaving(true);
      if (key == null) {
        // creating handled elsewhere
      } else {
        // Normalizar valores primero, luego derivar poliza_real a partir de la poliza normalizada
        const payload: any = {};
        // draft.valor puede estar formateado (puntos/coma) - normalizar antes de enviar
        const normalizedVal = normalizeDecimalInput(draft?.valor ?? null);
        if (normalizedVal) {
          if (!validateDecimalPrecision(normalizedVal)) {
            setLoteErrors((s) => ({
              ...s,
              [String(key)]: 'Valor excede la precisión permitida',
            }));
            setSaving(false);
            return;
          }
          payload.valor = normalizedVal;
        }
        const normalizedPol = normalizeDecimalInput(draft?.poliza ?? null);
        if (normalizedPol) {
          if (!validateDecimalPrecision(normalizedPol)) {
            setLoteErrors((s) => ({
              ...s,
              [String(key)]: 'Póliza excede la precisión permitida',
            }));
            setSaving(false);
            return;
          }
          payload.poliza = normalizedPol;
          payload.poliza_real = true;
        } else {
          // calcular póliza sintética a partir de valor y mantener poliza_real = false
          try {
            const baseVal = Number(normalizedVal);
            if (!Number.isNaN(baseVal)) {
              const synthetic = baseVal * 0.00013;
              const syntheticStr = synthetic.toFixed(2);
              if (validateDecimalPrecision(syntheticStr))
                payload.poliza = syntheticStr;
            }
          } catch {
            // ignore
          }
          payload.poliza_real = false;
        }
        const res = await fetch(`/api/lotes/${key}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => undefined);
          setLoteErrors((s) => ({
            ...s,
            [String(key)]: txt || `${res.status} ${res.statusText}`,
          }));
          throw new Error(txt || `${res.status} ${res.statusText}`);
        }
        await refetchProceso();
        cancelEditLote(id);
        showToast('Lote actualizado', 'success');
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const deleteLote = async (id: number | string) => {
    // realizar eliminación en cascada vía backend
    try {
      setSaving(true);
      const res = await fetch(`/api/lotes/${id}/cascade`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        setError(txt || `${res.status} ${res.statusText}`);
        showToast('Error eliminando lote', 'error');
        throw new Error(txt || `${res.status} ${res.statusText}`);
      }
      await refetchProceso();
      showToast('Lote y sus ofertas eliminados', 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  // Oferta delete helper
  const deleteOferta = async (
    ofertaId: number | string,
    loteId?: number | string,
  ) => {
    if (!proceso) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/ofertas/${ofertaId}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text().catch(() => undefined);
        setError(txt || `${res.status} ${res.statusText}`);
        showToast('Error eliminando oferta', 'error');
        throw new Error(txt || `${res.status} ${res.statusText}`);
      }
      // eliminar de la UI de forma optimista
      setProceso((p: any) => {
        if (!p) return p;
        return {
          ...p,
          lotes: (p.lotes || []).map((lo: any) =>
            lo.id === loteId
              ? {
                  ...lo,
                  ofertas: (lo.ofertas || []).filter(
                    (x: any) => String(x.id) !== String(ofertaId),
                  ),
                }
              : lo,
          ),
        };
      });
      await refetchProceso();
      showToast('Oferta eliminada', 'success');
    } catch (e: any) {
      setError(e?.message ?? String(e));
      showToast('Error eliminando oferta', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Estado y modal de confirmación para eliminar lote (incluye conteo de ofertas)
  const [loteConfirmOpen, setLoteConfirmOpen] = useState(false);
  const [pendingLoteDelete, setPendingLoteDelete] = useState<{
    id: number | string;
    ofertasCount: number;
  } | null>(null);

  const requestDeleteLote = (lote: any) => {
    const count = Array.isArray(lote?.ofertas) ? lote.ofertas.length : 0;
    setPendingLoteDelete({ id: lote.id, ofertasCount: count });
    setLoteConfirmOpen(true);
  };

  const cancelDeleteLote = () => {
    setPendingLoteDelete(null);
    setLoteConfirmOpen(false);
  };

  const confirmDeleteLote = async () => {
    if (!pendingLoteDelete) return;
    const idToDelete = pendingLoteDelete.id;
    setLoteConfirmOpen(false);
    setPendingLoteDelete(null);
    await deleteLote(idToDelete);
  };

  // Estado y modal de confirmación para eliminar fecha (mostramos tipo y fecha formateada)
  const [fechaConfirmOpen, setFechaConfirmOpen] = useState(false);
  const [pendingFechaDelete, setPendingFechaDelete] = useState<{
    id: number | string;
    tipoNombre?: string;
    fechaFormatted?: string;
  } | null>(null);

  const requestDeleteFecha = (f: any) => {
    const tipoNombre =
      f.tipoFechaProceso?.nombre ?? f['tipo_fecha_proceso']?.nombre ?? null;
    const fechaFormatted = formatFecha(f.fecha ?? null);
    setPendingFechaDelete({ id: f.id, tipoNombre, fechaFormatted });
    setFechaConfirmOpen(true);
  };

  const cancelDeleteFecha = () => {
    setPendingFechaDelete(null);
    setFechaConfirmOpen(false);
  };

  const confirmDeleteFecha = async () => {
    if (!pendingFechaDelete) return;
    const idToDelete = pendingFechaDelete.id;
    setFechaConfirmOpen(false);
    setPendingFechaDelete(null);
    await deleteFecha(idToDelete);
  };

  // Estado y modal de confirmación para eliminar oferta (mostramos consorcio/lote si están disponibles)
  const [ofertaConfirmOpen, setOfertaConfirmOpen] = useState(false);
  const [pendingOfertaDelete, setPendingOfertaDelete] = useState<{
    id: number | string;
    loteId?: number | string;
    consorcioNombre?: string;
  } | null>(null);

  const requestDeleteOferta = (of: any, loteId?: number | string) => {
    const consorcioNombre = of.consorcio?.nombre ?? null;
    setPendingOfertaDelete({ id: of.id, loteId: loteId, consorcioNombre });
    setOfertaConfirmOpen(true);
  };

  const cancelDeleteOferta = () => {
    setPendingOfertaDelete(null);
    setOfertaConfirmOpen(false);
  };

  const confirmDeleteOferta = async () => {
    if (!pendingOfertaDelete) return;
    const idToDelete = pendingOfertaDelete.id;
    const loteId = pendingOfertaDelete.loteId;
    setOfertaConfirmOpen(false);
    setPendingOfertaDelete(null);
    await deleteOferta(idToDelete, loteId);
  };

  // Helpers para mostrar nombres legibles de relaciones (soportan que `proceso` guarde sólo ids)
  const renderEntidad = () => {
    return getDisplayName(proceso.entidad, entidades);
  };

  const renderTipo = () => {
    return getDisplayName(proceso.tipoProceso ?? proceso.tipo_proceso, tipos);
  };

  const renderEstado = () => {
    return getDisplayName(proceso.estado, estados);
  };

  // Preferir una fecha marcada explícitamente como "importante" cuando exista;
  // de lo contrario reutilizar el selector compartido
  const pickedFecha = (() => {
    try {
      if (
        proceso &&
        Array.isArray(proceso.fechas) &&
        proceso.fechas.length > 0
      ) {
        const imp = (proceso.fechas || []).find((f: any) => !!f.importante);
        if (imp) {
          const tipoNombre =
            imp.tipoFechaProceso?.nombre ??
            imp['tipo_fecha_proceso']?.nombre ??
            null;
          return { fecha: imp.fecha ?? null, tipoNombre };
        }
      }
    } catch {}
    return pickFechaFromProceso(proceso);
  })();

  // Helper para construir el enlace SECOP cuando sólo disponemos del código "notice"
  const buildSecopNoticeUrl = (code: string | null | undefined) => {
    if (!code) return null;
    const c = String(code);
    return `https://www.secop.gov.co/CO1BusinessLine/Tendering/ContractNoticeView/Index?notice=${encodeURIComponent(c)}`;
  };

  // Helper para mapear el tipo de toast a clases de Tailwind (centralizado)
  const getToastClasses = (type: 'success' | 'error') => {
    return type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white';
  };

  // Helper para construir el enlace público/comunitario de SECOP a partir del código notice
  const buildSecopPublicUrl = (code: string | null | undefined) => {
    if (!code) return null;
    const c = String(code);
    return `https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=${encodeURIComponent(c)}`;
  };

  // Nota: las ramas de render se manejan dentro del JSX para mantener estable
  // el orden de declaración de hooks
  const renderLoading = () => <div className="p-6">Cargando proceso…</div>;

  const renderError = (msg: string | null) => (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto p-6 bg-yellow-50 text-yellow-900 rounded">
        <h2 className="font-semibold mb-2">No se pudo obtener el proceso</h2>
        <div className="text-sm">{msg}</div>
        <div className="mt-3">
          <Button
            href="/procesos"
            variant="secondary"
            className="inline-flex items-center gap-2 px-3 py-1 text-sm"
          >
            <span aria-hidden>←</span>
            <span>Volver</span>
          </Button>
        </div>
      </div>
    </main>
  );

  const renderNotFound = () => (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto p-6 bg-red-50 text-red-900 rounded">
        Proceso no encontrado.
      </div>
    </main>
  );

  // Use render helpers here — hooks were declared above so this keeps hook order stable
  if (loading) return renderLoading();
  if (error) return renderError(error);
  if (!proceso) return renderNotFound();

  return (
    <main className="min-h-screen p-6 bg-white text-gray-900">
      <div className="max-w-4xl mx-auto bg-gray-50 p-6 rounded shadow">
        <div className="mb-4">
          <Button
            href="/procesos"
            variant="secondary"
            className="inline-flex items-center gap-2 px-3 py-1 text-sm"
          >
            <span aria-hidden>←</span>
            <span>Volver</span>
          </Button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Proceso #{proceso.id}</h1>
          {/* Tiempo restante mostrado arriba a la derecha en grande */}
          <div className="text-right">
            {(() => {
              const raw = remainingTime(
                pickedFecha.fecha ?? proceso.fecha_proceso,
              );
              if (!raw || raw === '-')
                return <div className="text-sm text-gray-700">-</div>;
              if (raw === 'Vencido')
                return (
                  <div className="text-lg font-semibold text-red-600">
                    Vencido
                  </div>
                );
              // try to extract days/hours/min from the humanized string
              const m = raw.match(
                /(?:(\d+)\s*d[ií]a?s?)?\s*(?:(\d+)\s*hora?s?)?\s*(?:(\d+)\s*min)?/i,
              );
              if (m) {
                const days = m[1];
                const hours = m[2];
                const mins = m[3];
                const targetName = pickedFecha?.tipoNombre ?? 'publicación';
                if (days && hours) {
                  return (
                    <div className="text-lg font-semibold text-gray-800">{`Faltan ${days} día${days === '1' ? '' : 's'} y ${hours} hora${hours === '1' ? '' : 's'} para ${targetName}`}</div>
                  );
                }
                if (days)
                  return (
                    <div className="text-lg font-semibold text-gray-800">{`Faltan ${days} día${days === '1' ? '' : 's'} para ${targetName}`}</div>
                  );
                if (hours)
                  return (
                    <div className="text-lg font-semibold text-gray-800">{`Faltan ${hours} hora${hours === '1' ? '' : 's'} para ${targetName}`}</div>
                  );
                if (mins)
                  return (
                    <div className="text-lg font-semibold text-gray-800">{`Faltan ${mins} minuto${mins === '1' ? '' : 's'} para ${targetName}`}</div>
                  );
              }
              // fallback: show raw value prefixed
              const targetName = pickedFecha?.tipoNombre ?? 'publicación';
              return (
                <div className="text-lg font-semibold text-gray-800">{`Faltan ${raw} para ${targetName}`}</div>
              );
            })()}
          </div>
        </div>

        <div className="space-y-4">
          <div className="mb-2">
            {(() => {
              const rawVal = proceso.codigoLink ?? proceso.codigo_link ?? null;
              const token = extractCodigoFromUrl(rawVal);
              const secop = buildSecopNoticeUrl(token);
              const secopPub = buildSecopPublicUrl(token);
              return (
                <>
                  <div className="text-sm text-gray-600">
                    <strong>Link SECOP:</strong>{' '}
                    {token && secop ? (
                      <a
                        className="text-indigo-600 hover:underline"
                        href={secop}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {secop}
                      </a>
                    ) : (
                      '-'
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Link SECOP público:</strong>{' '}
                    {token && secopPub ? (
                      <a
                        className="text-indigo-600 hover:underline"
                        href={secopPub}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {secopPub}
                      </a>
                    ) : (
                      '-'
                    )}
                  </div>
                </>
              );
            })()}
          </div>
          <div>
            <h2 className="font-semibold">Objeto</h2>
            <div className="text-gray-800">
              {editing === 'objeto' ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      disabled={saving}
                      className={`border px-2 py-1 rounded ${fieldErrors.objeto ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
                      value={draft.objeto ?? ''}
                      onChange={(e) =>
                        setDraft((d: any) => ({ ...d, objeto: e.target.value }))
                      }
                    />
                    <Button
                      variant="primary"
                      onClick={() => saveField('objeto')}
                      loading={saving}
                    >
                      Guardar
                    </Button>
                    <Button variant="secondary" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                    {fieldSuccess.objeto && (
                      <span className="text-green-600 ml-2">Guardado</span>
                    )}
                  </div>
                  {fieldErrors.objeto && (
                    <div className="text-red-600 text-sm">
                      {fieldErrors.objeto}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>{proceso.objeto ?? '-'}</div>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('objeto')}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Entidad</h2>
            <div className="text-gray-800">
              {editing === 'entidad' ? (
                <RelationEditor
                  field={'entidad'}
                  list={entidades}
                  display={entidadDisplay}
                  setDisplay={setEntidadDisplay}
                  query={entidadQuery}
                  setQuery={setEntidadQuery}
                  selected={entidadSelected}
                  setSelected={setEntidadSelected}
                  refEl={entidadRef}
                  placeholder={
                    'Escriba para filtrar y haga clic para seleccionar'
                  }
                  createKind={'entidad'}
                  saving={saving}
                  fieldErrors={fieldErrors}
                  setDraft={setDraft}
                  saveField={saveField}
                  cancelEdit={cancelEdit}
                  creatingOption={creatingOption}
                  setCreatingOption={setCreatingOption}
                  createOption={createOption}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div>{renderEntidad()}</div>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('entidad')}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Anticipo</h2>
            <div className="text-gray-800">
              {editing === 'anticipo' ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <input
                      disabled={saving}
                      type="number"
                      step={1}
                      min={0}
                      max={50}
                      className="border px-2 py-1 rounded"
                      value={draft.anticipo ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDraft((d: any) => {
                          if (raw === '') return { ...d, anticipo: '' };
                          const n = Number(raw);
                          if (Number.isNaN(n)) return { ...d, anticipo: '' };
                          // truncate decimals (no permitir decimales) and clamp to [0,50]
                          const intval = Math.trunc(n);
                          const clamped = Math.max(0, Math.min(50, intval));
                          return { ...d, anticipo: clamped };
                        });
                      }}
                    />
                    <Button
                      variant="primary"
                      onClick={() => saveField('anticipo')}
                      loading={saving}
                    >
                      Guardar
                    </Button>
                    <Button variant="secondary" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                    {fieldSuccess.anticipo && (
                      <span className="text-green-600 ml-2">Guardado</span>
                    )}
                  </div>
                  {fieldErrors.anticipo && (
                    <div className="text-red-600 text-sm">
                      {fieldErrors.anticipo}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    {proceso.anticipo == null ? '-' : `${proceso.anticipo}%`}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('anticipo')}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Mipyme</h2>
            <div className="text-gray-800">
              {editing === 'mipyme' ? (
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      disabled={saving}
                      type="checkbox"
                      checked={draft.mipyme ?? !!proceso.mipyme}
                      onChange={(e) =>
                        setDraft((d: any) => ({
                          ...d,
                          mipyme: e.target.checked,
                        }))
                      }
                    />{' '}
                    Marcar
                  </label>
                  <Button
                    variant="primary"
                    onClick={() => saveField('mipyme')}
                    loading={saving}
                  >
                    Guardar
                  </Button>
                  <Button variant="secondary" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                  {fieldSuccess.mipyme && (
                    <span className="text-green-600 ml-2">Guardado</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>{proceso.mipyme ? 'Sí' : 'No'}</div>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('mipyme')}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Estado</h2>
            <div className="text-gray-800">
              {editing === 'estado' ? (
                <RelationEditor
                  field={'estado'}
                  list={estados}
                  display={estadoDisplay}
                  setDisplay={setEstadoDisplay}
                  query={estadoQuery}
                  setQuery={setEstadoQuery}
                  selected={estadoSelected}
                  setSelected={setEstadoSelected}
                  refEl={estadoRef}
                  placeholder={
                    'Escriba para filtrar y haga clic para seleccionar'
                  }
                  createKind={'estado'}
                  saving={saving}
                  fieldErrors={fieldErrors}
                  setDraft={setDraft}
                  saveField={saveField}
                  cancelEdit={cancelEdit}
                  creatingOption={creatingOption}
                  setCreatingOption={setCreatingOption}
                  createOption={createOption}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div>{renderEstado()}</div>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('estado')}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Tipo de proceso</h2>
            <div className="text-gray-800">
              {editing === 'tipoProceso' ? (
                <RelationEditor
                  field={'tipoProceso'}
                  list={tipos}
                  display={tipoDisplay}
                  setDisplay={setTipoDisplay}
                  query={tipoQuery}
                  setQuery={setTipoQuery}
                  selected={tipoSelected}
                  setSelected={setTipoSelected}
                  refEl={tipoRef}
                  placeholder={
                    'Escriba para filtrar y haga clic para seleccionar'
                  }
                  createKind={'tipo'}
                  saving={saving}
                  fieldErrors={fieldErrors}
                  setDraft={setDraft}
                  saveField={saveField}
                  cancelEdit={cancelEdit}
                  creatingOption={creatingOption}
                  setCreatingOption={setCreatingOption}
                  createOption={createOption}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div>{renderTipo()}</div>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('tipoProceso')}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Link</h2>
            <div className="text-gray-800">
              {editing === 'codigoLink' ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      disabled={saving}
                      className="border px-2 py-1 rounded"
                      value={
                        draft.codigoLink ??
                        proceso.codigoLink ??
                        proceso.codigo_link ??
                        ''
                      }
                      onChange={(e) =>
                        setDraft((d: any) => ({
                          ...d,
                          codigoLink: e.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="primary"
                      onClick={() => saveField('codigoLink')}
                      loading={saving}
                    >
                      Guardar
                    </Button>
                    <Button variant="secondary" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                    {fieldSuccess.codigoLink && (
                      <span className="text-green-600 ml-2">Guardado</span>
                    )}
                  </div>
                  {fieldErrors.codigoLink && (
                    <div className="text-red-600 text-sm">
                      {fieldErrors.codigoLink}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {MESSAGES.codigoLink.help}
                  </div>
                  {draft.codigoLink && (
                    <div className="text-sm text-gray-700">
                      Token detectado:{' '}
                      <strong>
                        {extractCodigoFromUrl(draft.codigoLink) ?? '-'}
                      </strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>{proceso.codigoLink ?? proceso.codigo_link ?? '-'}</div>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('codigoLink')}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Renderizar dinámicamente otros campos escalares (excepto relaciones lote/fechas) */}
          {Object.keys(proceso)
            .filter(
              (k) =>
                ![
                  'lotes',
                  'fechas',
                  'tipoProceso',
                  'estado',
                  'entidad',
                  'codigoLink',
                  'codigo_link',
                ].includes(k),
            )
            .map((k) =>
              [
                'id',
                'objeto',
                'anticipo',
                'mipyme',
                'tipo_proceso',
                'estado',
                'entidad',
                'codigo_link',
                'tipoProceso',
                'estado',
              ].includes(k) ? null : (
                <div key={k}>
                  <h2 className="font-semibold">{k}</h2>
                  <div className="text-gray-800">
                    <pre className="whitespace-pre-wrap">
                      {String((proceso as any)[k])}
                    </pre>
                  </div>
                </div>
              ),
            )}

          {/* Lotes y Fechas al final */}
          <div>
            <h2 className="font-semibold">Fechas</h2>
            {/* Lista detallada de fechas. */}
            <div className="space-y-2 mt-2">
              {Array.isArray(proceso.fechas) && proceso.fechas.length > 0 ? (
                // renderizar primero la fecha marcada como importante, luego el resto ordenadas por timestamp
                [...(proceso.fechas || [])]
                  .slice()
                  .sort((a: any, b: any) => {
                    if (!!a.importante && !b.importante) return -1;
                    if (!!b.importante && !a.importante) return 1;
                    const ta = a?.fecha ? new Date(a.fecha).getTime() : 0;
                    const tb = b?.fecha ? new Date(b.fecha).getTime() : 0;
                    return ta - tb;
                  })
                  .map((f: any) => (
                    <div
                      key={f.id ?? Math.random()}
                      className="p-3 bg-white border rounded"
                    >
                      {editingFechaId &&
                      String(editingFechaId) === String(f.id) ? (
                        <div className="flex flex-col gap-2">
                          <FechaForm
                            draft={fechaEdits[String(f.id)] ?? {}}
                            changeDraft={(patch: any) =>
                              setFechaEdits((s) => ({
                                ...s,
                                [String(f.id)]: {
                                  ...(s[String(f.id)] || {}),
                                  ...patch,
                                },
                              }))
                            }
                            attemptSave={fechaAttemptSave[String(f.id)]}
                            markAttempt={() =>
                              setFechaAttemptSave((s) => ({
                                ...s,
                                [String(f.id)]: true,
                              }))
                            }
                            error={fechaErrors[String(f.id)]}
                            onSave={() => saveFecha(f.id)}
                            onCancel={() => cancelEditFecha(f.id)}
                            onDelete={() => requestDeleteFecha(f)}
                            tipoFechas={tipoFechas}
                            saving={saving}
                            isNew={false}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <div>
                                  <strong>Tipo:</strong>{' '}
                                  {f.tipoFechaProceso?.nombre ??
                                    f['tipo_fecha_proceso']?.nombre ??
                                    'Tipo desconocido'}
                                </div>
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!f.importante}
                                    onChange={(e) =>
                                      toggleImportante(f.id, e.target.checked)
                                    }
                                  />
                                  <span className="text-sm">Importante</span>
                                </label>
                              </div>
                              <div>
                                <strong>Fecha:</strong>{' '}
                                {formatFecha(f.fecha ?? null)}
                              </div>
                              {f.observacion && (
                                <div>
                                  <strong>Observación:</strong> {f.observacion}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm text-gray-600">
                                {remainingTime(f.fecha)}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => startEditFecha(f)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() => requestDeleteFecha(f)}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-gray-600">
                  {proceso.fecha_proceso ?? '-'}
                </div>
              )}

              {/* Create new fecha (no max limit) */}
              {creatingFecha ? (
                <div className="p-3 bg-white border rounded">
                  <div className="flex flex-col gap-2">
                    <FechaForm
                      draft={newFechaDraft}
                      changeDraft={(patch: any) =>
                        setNewFechaDraft((d) => ({ ...d, ...patch }))
                      }
                      attemptSave={newFechaAttemptSave}
                      markAttempt={() => setNewFechaAttemptSave(true)}
                      error={fechaErrors.create}
                      onSave={() => {
                        setNewFechaAttemptSave(true);
                        createFecha();
                      }}
                      onCancel={() => {
                        setCreatingFecha(false);
                        setNewFechaDraft({});
                        setNewFechaAttemptSave(false);
                      }}
                      onDelete={undefined}
                      tipoFechas={tipoFechas}
                      saving={saving}
                      isNew={true}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCreatingFecha(true);
                      setNewFechaDraft({});
                      setNewFechaAttemptSave(false);
                    }}
                  >
                    Agregar fecha
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold">Lotes</h2>
            <div className="space-y-2 mt-2">
              {Array.isArray(proceso.lotes) && proceso.lotes.length > 0 ? (
                proceso.lotes.map((l: any) => (
                  <div
                    key={l.id ?? Math.random()}
                    className="p-3 bg-white border rounded"
                  >
                    {editingLoteId && String(editingLoteId) === String(l.id) ? (
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">
                            $
                          </span>
                          <input
                            style={{ paddingLeft: '1.5rem' }}
                            maxLength={32}
                            inputMode="decimal"
                            className={`border px-2 py-1 rounded w-full ${loteAttemptSave[String(l.id)] && loteErrors[String(l.id)] ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
                            value={loteEdits[String(l.id)]?.valor ?? ''}
                            onChange={(e) =>
                              setLoteEdits((s) => ({
                                ...s,
                                [String(l.id)]: {
                                  ...(s[String(l.id)] || {}),
                                  valor: formatWithCommaDecimal(e.target.value),
                                },
                              }))
                            }
                            placeholder="Valor"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">
                            $
                          </span>
                          <input
                            style={{ paddingLeft: '1.5rem' }}
                            maxLength={32}
                            inputMode="decimal"
                            className={`border px-2 py-1 rounded w-full focus:ring-indigo-200`}
                            value={loteEdits[String(l.id)]?.poliza ?? ''}
                            onChange={(e) =>
                              setLoteEdits((s) => ({
                                ...s,
                                [String(l.id)]: {
                                  ...(s[String(l.id)] || {}),
                                  poliza: formatWithCommaDecimal(
                                    e.target.value,
                                  ),
                                },
                              }))
                            }
                            placeholder="Número de póliza"
                          />
                        </div>
                        {loteAttemptSave[String(l.id)] &&
                          loteErrors[String(l.id)] && (
                            <div className="text-red-600 text-sm">
                              {loteErrors[String(l.id)]}
                            </div>
                          )}
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={() => saveLote(l.id)}
                            loading={saving}
                          >
                            Guardar
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => cancelEditLote(l.id)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => requestDeleteLote(l)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div>
                            <strong>Valor:</strong> ${' '}
                            {formatForDisplay(l.valor ?? null) ?? '-'}
                          </div>
                          {l.poliza !== undefined && (
                            <div>
                              <strong>
                                {l.poliza_real === false
                                  ? 'Póliza (aprox):'
                                  : 'Póliza:'}
                              </strong>{' '}
                              <span className="ml-2">
                                $ {formatForDisplay(l.poliza ?? null) ?? '-'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={async () => {
                              // ensure we have the latest consorcios before opening the form
                              try {
                                await loadConsorcios();
                              } catch {}
                              setCreatingOption({ kind: 'oferta', name: '' });
                              setNewOfertaDraft({
                                consorcioId: null,
                                loteId: l.id,
                              });
                            }}
                          >
                            Agregar oferta
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => startEditLote(l)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => requestDeleteLote(l)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* renderizar ofertas para este lote (si las hay) */}
                    {Array.isArray(l.ofertas) && l.ofertas.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-lg font-semibold text-black">
                          Ofertas
                        </div>
                        {l.ofertas.map((of: any) => (
                          <div
                            key={of.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                          >
                            <div>
                              {editingOfertaId === of.id ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={
                                      ofertaEdits[String(of.id)]?.consorcioId ??
                                      ''
                                    }
                                    onChange={(e) =>
                                      setOfertaEdits((s) => ({
                                        ...s,
                                        [String(of.id)]: {
                                          ...(s[String(of.id)] || {}),
                                          consorcioId: e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                        },
                                      }))
                                    }
                                    className={`border px-2 py-1 rounded ${!ofertaEdits[String(of.id)]?.consorcioId && ofertaAttemptSave[String(of.id)] ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
                                  >
                                    <option value="" disabled>
                                      -- Ninguno --
                                    </option>
                                    {(consorciosList || []).map((c: any) => (
                                      <option key={c.id} value={c.id}>
                                        {c.nombre}
                                      </option>
                                    ))}
                                  </select>
                                  {!ofertaEdits[String(of.id)]?.consorcioId &&
                                    ofertaAttemptSave[String(of.id)] && (
                                      <div className="text-red-600 text-sm">
                                        Seleccione un consorcio
                                      </div>
                                    )}
                                </div>
                              ) : (
                                <div className="text-sm">
                                  Consorcio: {of.consorcio?.nombre ?? '-'}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {editingOfertaId === of.id ? (
                                <>
                                  <Button
                                    variant="primary"
                                    onClick={() => saveOferta(of.id)}
                                    loading={saving}
                                  >
                                    Guardar
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    onClick={() => cancelEditOferta(of.id)}
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    onClick={() => startEditOferta(of)}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="danger"
                                    onClick={() =>
                                      requestDeleteOferta(of, l.id)
                                    }
                                  >
                                    Eliminar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* formulario de oferta por lote */}
                    {creatingOption.kind === 'oferta' &&
                      newOfertaDraft.loteId === l.id && (
                        <div className="mt-3 p-3 bg-gray-50 border rounded">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">
                              Consorcio
                            </label>
                            <div className="flex gap-2 items-center">
                              <select
                                value={
                                  (newOfertaDraft.consorcioId ?? '') as any
                                }
                                onChange={(e) =>
                                  setNewOfertaDraft((d: any) => ({
                                    ...d,
                                    consorcioId: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  }))
                                }
                                className={`border px-2 py-1 rounded flex-1 ${!newOfertaDraft.consorcioId && newOfertaAttemptSave[String(newOfertaDraft.loteId)] ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
                              >
                                <option value="" disabled>
                                  -- Ninguno --
                                </option>
                                {(consorciosList || []).map((c: any) => (
                                  <option key={c.id} value={c.id}>
                                    {c.nombre ?? c.id}
                                  </option>
                                ))}
                              </select>
                              <input
                                placeholder="Nuevo consorcio"
                                value={newConsorcioName}
                                onChange={(e) =>
                                  setNewConsorcioName(e.target.value)
                                }
                                className="border px-2 py-1 rounded w-40"
                              />
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  createOption('consorcio', newConsorcioName)
                                }
                                disabled={
                                  String(newConsorcioName).trim().length === 0
                                }
                                disabledTooltip="Ingrese un nombre para crear el consorcio"
                              >
                                Crear
                              </Button>
                            </div>
                            {!newOfertaDraft.consorcioId &&
                              newOfertaAttemptSave[
                                String(newOfertaDraft.loteId)
                              ] && (
                                <div className="text-red-600 text-sm">
                                  Seleccione un consorcio
                                </div>
                              )}
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                onClick={async () => {
                                  // Quick client-side validation before trying network call
                                  if (!newOfertaDraft.consorcioId) {
                                    setNewOfertaAttemptSave((s) => ({
                                      ...s,
                                      [String(newOfertaDraft.loteId)]: true,
                                    }));
                                    return;
                                  }
                                  await createOferta(
                                    Number(newOfertaDraft.consorcioId),
                                    l.id,
                                  );
                                }}
                                disabled={!newOfertaDraft.consorcioId}
                                disabledTooltip="Seleccione un consorcio para crear la oferta"
                              >
                                Crear oferta
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setCreatingOption({ kind: null, name: '' });
                                  setNewOfertaDraft({});
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                ))
              ) : (
                <div className="text-gray-600">-</div>
              )}

              {/* Crear nuevo lote */}
              {creatingLote ? (
                <div className="p-3 bg-white border rounded">
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">
                        $
                      </span>
                      <input
                        style={{ paddingLeft: '1.5rem' }}
                        maxLength={32}
                        inputMode="decimal"
                        className={`border px-2 py-1 rounded w-full ${newLoteAttemptSave && loteErrors.create ? 'border-red-600 focus:ring-red-200' : 'focus:ring-indigo-200'}`}
                        value={newLoteDraft.valor ?? ''}
                        onChange={(e) =>
                          setNewLoteDraft((d) => ({
                            ...d,
                            valor: formatWithCommaDecimal(e.target.value),
                          }))
                        }
                        placeholder="Valor"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">
                        $
                      </span>
                      <input
                        style={{ paddingLeft: '1.5rem' }}
                        maxLength={32}
                        inputMode="decimal"
                        className={`border px-2 py-1 rounded w-full focus:ring-indigo-200`}
                        value={newLoteDraft.poliza ?? ''}
                        onChange={(e) =>
                          setNewLoteDraft((d) => ({
                            ...d,
                            poliza: formatWithCommaDecimal(e.target.value),
                          }))
                        }
                        placeholder="Número de póliza"
                      />
                    </div>
                    {/* poliza_real is derived from presence of poliza; not user-editable */}
                    {loteErrors.create && (
                      <div className="text-red-600 text-sm">
                        {loteErrors.create}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={createLote}
                        loading={saving}
                      >
                        Crear lote
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setCreatingLote(false);
                          setNewLoteDraft({});
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setNewLoteDraft({
                        valor: '',
                        poliza: '',
                        poliza_real: false,
                      });
                      setCreatingLote(true);
                    }}
                  >
                    Agregar lote
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* las ofertas se renderizan por lote arriba dentro de cada tarjeta de lote */}
        </div>
      </div>

      {/* Notificación (toast) */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 px-4 py-2 rounded shadow ${getToastClasses(toast.type)}`}
        >
          {toast.message}
        </div>
      )}
      {/* Confirm modal for lote deletion */}
      <ConfirmModal
        open={loteConfirmOpen}
        title="Eliminar lote"
        message={
          pendingLoteDelete
            ? `El lote tiene ${pendingLoteDelete.ofertasCount} oferta(s). ¿Deseas eliminar también las ofertas y el lote? Esta acción no se puede deshacer.`
            : '¿Deseas eliminar este lote? Esta acción no se puede deshacer.'
        }
        onConfirm={confirmDeleteLote}
        onCancel={cancelDeleteLote}
      />
      {/* Confirm modal for fecha deletion */}
      <ConfirmModal
        open={fechaConfirmOpen}
        title="Eliminar fecha"
        message={
          pendingFechaDelete
            ? `¿Eliminar la fecha ${pendingFechaDelete.tipoNombre ? `(${pendingFechaDelete.tipoNombre}) ` : ''}${pendingFechaDelete.fechaFormatted ? `en ${pendingFechaDelete.fechaFormatted} ` : ''}? Esta acción no se puede deshacer.`
            : '¿Deseas eliminar esta fecha? Esta acción no se puede deshacer.'
        }
        onConfirm={confirmDeleteFecha}
        onCancel={cancelDeleteFecha}
      />
      {/* Confirm modal for oferta deletion */}
      <ConfirmModal
        open={ofertaConfirmOpen}
        title="Eliminar oferta"
        message={
          pendingOfertaDelete
            ? `¿Eliminar la oferta${pendingOfertaDelete.consorcioNombre ? ` del consorcio ${pendingOfertaDelete.consorcioNombre}` : ''}? Esta acción no se puede deshacer.`
            : '¿Deseas eliminar esta oferta? Esta acción no se puede deshacer.'
        }
        onConfirm={confirmDeleteOferta}
        onCancel={cancelDeleteOferta}
      />
    </main>
  );
}
