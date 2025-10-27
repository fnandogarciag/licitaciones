'use client';
import React, { useCallback, useEffect, useState } from 'react';
import ConfirmModal from '@/app/ui/ConfirmModal';
import Button from '@/app/ui/Button';
import Input from '@/app/ui/Input';
import Select from '@/app/ui/Select';
import Toggle from '@/app/ui/Toggle';
import { formatFecha, parseFechaLocalToISO } from '@/app/utils/tiempo';
import {
  normalizeDecimalInput,
  validateDecimalPrecision,
  formatWithCommaDecimal,
  formatForDisplay,
} from '@/app/utils/number';
import { getRelationId } from '@/app/utils/relations';

const ENTITIES = [
  'empresas',
  'procesos',
  'lotes',
  'ofertas',
  'entidades',
  'consorcios',
  'consorcio_empresa',
  'fecha_proceso',
  'tipo_proceso',
  'tipo_fecha_proceso',
  'estado_proceso',
];

const baseUrl = (process.env.NEXT_PUBLIC_API_BASE as string) ?? '';

const getId = (it: any) =>
  it?.id ??
  it?.ID ??
  it?.Id ??
  it?._id ??
  it?.uuid ??
  it?.UUID ??
  it?.[Object.keys(it)[0]];

export default function AdminPage() {
  // Estado principal del panel de administración
  const [entity, setEntity] = useState<string>(ENTITIES[0]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [editorValue, setEditorValue] = useState<string>('{}');

  // Estado específico por entidad (algunos se declaran más abajo también)
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [procesoObjeto, setProcesoObjeto] = useState('');
  const [procesoEntidadId, setProcesoEntidadId] = useState<number | null>(null);
  const [procesoTipoId, setProcesoTipoId] = useState<number | null>(null);
  const [procesoEstadoId, setProcesoEstadoId] = useState<number | null>(null);
  const [procesoAnticipo, setProcesoAnticipo] = useState<number | ''>('');
  const [procesoMipyme, setProcesoMipyme] = useState<boolean>(false);
  const [procesoCodigoLink, setProcesoCodigoLink] = useState('');

  // Reiniciar todos los campos del formulario a su estado inicial vacío
  const resetFormFields = () => {
    setEmpresaNombre('');
    setProcesoObjeto('');
    setProcesoEntidadId(null);
    setProcesoAnticipo('');
    setProcesoMipyme(false);
    setProcesoCodigoLink('');

    setProcesoTipoId(null);
    setProcesoEstadoId(null);

    setLoteProcesoId(null);
    setLoteValor('');
    setLotePoliza('');

    setOfertaLoteId(null);
    setOfertaConsorcioId(null);

    setEntidadNombre('');
    setConsorcioNombre('');

    setConsorcioEmpresaConsorcioId(null);
    setConsorcioEmpresaEmpresaId(null);

    setFechaProcesoProcesoId(null);
    setFechaProcesoTipoId(null);
    setFechaProcesoFecha('');

    setTipoProcesoNombre('');
    setTipoFechaProcesoNombre('');
    setEstadoProcesoNombre('');
  };

  // Estado del formulario para otras entidades
  const [loteProcesoId, setLoteProcesoId] = useState<number | null>(null);
  const [loteValor, setLoteValor] = useState('');
  const [lotePoliza, setLotePoliza] = useState('');
  // poliza_real se derivará de la presencia de póliza; no editable por el usuario

  const [ofertaLoteId, setOfertaLoteId] = useState<number | null>(null);
  const [ofertaConsorcioId, setOfertaConsorcioId] = useState<number | null>(
    null,
  );

  const [entidadNombre, setEntidadNombre] = useState('');

  const [consorcioNombre, setConsorcioNombre] = useState('');

  const [consorcioEmpresaConsorcioId, setConsorcioEmpresaConsorcioId] =
    useState<number | null>(null);
  const [consorcioEmpresaEmpresaId, setConsorcioEmpresaEmpresaId] = useState<
    number | null
  >(null);

  const [fechaProcesoProcesoId, setFechaProcesoProcesoId] = useState<
    number | null
  >(null);
  const [fechaProcesoTipoId, setFechaProcesoTipoId] = useState<number | null>(
    null,
  );
  const [fechaProcesoFecha, setFechaProcesoFecha] = useState('');

  const [tipoProcesoNombre, setTipoProcesoNombre] = useState('');
  const [tipoFechaProcesoNombre, setTipoFechaProcesoNombre] = useState('');
  const [estadoProcesoNombre, setEstadoProcesoNombre] = useState('');

  // Listas relacionadas para los selects
  const [procesosList, setProcesosList] = useState<any[]>([]);
  const [lotesList, setLotesList] = useState<any[]>([]);
  const [consorciosList, setConsorciosList] = useState<any[]>([]);
  const [empresasList, setEmpresasList] = useState<any[]>([]);
  const [tipoProcesoList, setTipoProcesoList] = useState<any[]>([]);
  const [tipoFechaProcesoList, setTipoFechaProcesoList] = useState<any[]>([]);
  const [estadoProcesoList, setEstadoProcesoList] = useState<any[]>([]);

  const fetchItems = useCallback(
    async (e?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${baseUrl}/api/${e || entity}`);
        if (!res.ok) throw new Error('Error al obtener datos');
        const data = await res.json();
        setItems(data || []);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [entity],
  );

  // Refrescar listas relacionadas usadas por varios selects (procesos, lotes, empresas, etc.)
  const refreshRelatedLists = useCallback(async () => {
    try {
      const [
        entRes,
        procRes,
        loteRes,
        consRes,
        empRes,
        tipoPRes,
        tipoFRes,
        estadoRes,
      ] = await Promise.all([
        fetch(`${baseUrl}/api/entidades`),
        fetch(`${baseUrl}/api/procesos`),
        fetch(`${baseUrl}/api/lotes`),
        fetch(`${baseUrl}/api/consorcios`),
        fetch(`${baseUrl}/api/empresas`),
        fetch(`${baseUrl}/api/tipo_proceso`),
        fetch(`${baseUrl}/api/tipo_fecha_proceso`),
        fetch(`${baseUrl}/api/estado_proceso`),
      ]);

      if (entRes.ok) {
        const data = await entRes.json();
        setEntidadesList(Array.isArray(data) ? data : [data]);
      }
      if (procRes.ok) {
        const data = await procRes.json();
        setProcesosList(Array.isArray(data) ? data : [data]);
      }
      if (loteRes.ok) {
        const data = await loteRes.json();
        setLotesList(Array.isArray(data) ? data : [data]);
      }
      if (consRes.ok) {
        const data = await consRes.json();
        setConsorciosList(Array.isArray(data) ? data : [data]);
      }
      if (empRes.ok) {
        const data = await empRes.json();
        setEmpresasList(Array.isArray(data) ? data : [data]);
      }
      if (tipoPRes.ok) {
        const data = await tipoPRes.json();
        setTipoProcesoList(Array.isArray(data) ? data : [data]);
      }
      if (tipoFRes.ok) {
        const data = await tipoFRes.json();
        setTipoFechaProcesoList(Array.isArray(data) ? data : [data]);
      }
      if (estadoRes.ok) {
        const data = await estadoRes.json();
        setEstadoProcesoList(Array.isArray(data) ? data : [data]);
      }
    } catch {
      // ignorar errores aquí
    }
  }, []);

  // Mensajes de validación a nivel de campo (string)
  const procesoAnticipoError =
    procesoAnticipo !== ''
      ? Number.isNaN(Number(procesoAnticipo)) ||
        Number(procesoAnticipo) < 0 ||
        Number(procesoAnticipo) > 50
        ? 'Anticipo debe estar entre 0 y 50'
        : !Number.isInteger(Number(procesoAnticipo))
          ? 'Anticipo debe ser un número entero (sin decimales)'
          : ''
      : '';

  // Otros mensajes de validación en línea (cadenas)
  const empresaError = !(empresaNombre || '').trim()
    ? 'El nombre de la empresa es obligatorio'
    : '';
  const procesoObjetoError = !(procesoObjeto || '').trim()
    ? 'El campo objeto es obligatorio'
    : '';
  const consorcioEmpresaError =
    !consorcioEmpresaConsorcioId || !consorcioEmpresaEmpresaId
      ? 'Consorcio y Empresa son obligatorios'
      : '';
  const fechaProcesoError =
    fechaProcesoFecha && !parseFechaLocalToISO(fechaProcesoFecha)
      ? 'Fecha no válida. Use YYYY-MM-DD o 13/10/2025 - 09:00 am'
      : '';
  const tipoProcesoError = !(tipoProcesoNombre || '').trim()
    ? 'Nombre obligatorio'
    : '';
  const tipoFechaProcesoError = !(tipoFechaProcesoNombre || '').trim()
    ? 'Nombre obligatorio'
    : '';
  const estadoProcesoError = !(estadoProcesoNombre || '').trim()
    ? 'Nombre obligatorio'
    : '';
  const entidadError = !(entidadNombre || '').trim()
    ? 'Nombre de la entidad obligatorio'
    : '';
  const consorcioError = !(consorcioNombre || '').trim()
    ? 'Nombre del consorcio obligatorio'
    : '';

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Notificaciones
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const pushNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCreate = async () => {
    setError(null);
    try {
      // Validaciones básicas
      if (entity === 'empresas' && !(empresaNombre || '').trim()) {
        setError('El nombre de la empresa es obligatorio');
        pushNotice('error', 'El nombre de la empresa es obligatorio');
        return;
      }
      if (entity === 'procesos' && !(procesoObjeto || '').trim()) {
        setError('El campo objeto es obligatorio');
        pushNotice('error', 'El campo objeto es obligatorio');
        return;
      }

      // Validación de anticipo
      if (entity === 'procesos' && procesoAnticipo !== '') {
        const n = Number(procesoAnticipo);
        if (Number.isNaN(n) || n < 0 || n > 50) {
          setError('Anticipo debe estar entre 0 y 50');
          pushNotice('error', 'Anticipo debe estar entre 0 y 50');
          return;
        }
        if (!Number.isInteger(n)) {
          setError('Anticipo debe ser un número entero (sin decimales)');
          pushNotice(
            'error',
            'Anticipo debe ser un número entero (sin decimales)',
          );
          return;
        }
      }

      let payload: any;
      if (entity === 'empresas') {
        payload = { nombre: (empresaNombre ?? '').trim() };
      } else if (entity === 'procesos') {
        payload = {
          objeto: procesoObjeto,
          entidadId: procesoEntidadId || undefined,
          tipoProcesoId: procesoTipoId || undefined,
          estadoId: procesoEstadoId || undefined,
          anticipo:
            procesoAnticipo === '' ? undefined : Number(procesoAnticipo),
          mipyme: procesoMipyme,
          codigoLink: procesoCodigoLink || undefined,
        };
      } else if (entity === 'lotes') {
        // normalize decimals to string with 2 decimals
        const normVal = normalizeDecimalInput(loteValor || null);
        const normPol = normalizeDecimalInput(lotePoliza || null);
        if (!normVal) {
          setError('Valor inválido');
          pushNotice('error', 'Valor inválido');
          return;
        }
        if (
          !validateDecimalPrecision(normVal) ||
          (normPol && !validateDecimalPrecision(normPol))
        ) {
          setError('Valor o póliza excede precisión permitida');
          pushNotice('error', 'Valor o póliza excede precisión permitida');
          return;
        }
        payload = {
          procesoId: loteProcesoId || undefined,
          valor: normVal,
          poliza: normPol || undefined,
          poliza_real: !!normPol,
        };
      } else if (entity === 'ofertas') {
        payload = {
          loteId: ofertaLoteId || undefined,
          consorcioId: ofertaConsorcioId || undefined,
        };
      } else if (entity === 'entidades') {
        payload = { nombre: entidadNombre || undefined };
      } else if (entity === 'consorcios') {
        payload = { nombre: consorcioNombre || undefined };
      } else if (entity === 'consorcio_empresa') {
        payload = {
          consorcioId: consorcioEmpresaConsorcioId || undefined,
          empresaId: consorcioEmpresaEmpresaId || undefined,
        };
      } else if (entity === 'fecha_proceso') {
        // Try to parse various local formats into an ISO string in Colombia timezone
        const parsed = parseFechaLocalToISO(fechaProcesoFecha || undefined);
        if (fechaProcesoFecha && !parsed) {
          setError(
            'Fecha no válida. Use formato ISO o local (ej. 13/10/2025 - 09:00 am)',
          );
          pushNotice('error', 'Fecha no válida');
          return;
        }
        payload = {
          procesoId: fechaProcesoProcesoId || undefined,
          tipoFechaProcesoId: fechaProcesoTipoId || undefined,
          fecha: parsed || undefined,
        };
      } else if (entity === 'tipo_proceso') {
        payload = { nombre: tipoProcesoNombre || undefined };
      } else if (entity === 'tipo_fecha_proceso') {
        payload = { nombre: tipoFechaProcesoNombre || undefined };
      } else if (entity === 'estado_proceso') {
        payload = { nombre: estadoProcesoNombre || undefined };
      } else {
        payload = JSON.parse(editorValue);
      }
      const res = await fetch(`${baseUrl}/api/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al crear');
      await fetchItems();
      await refreshRelatedLists();
      setEditorValue('{}');
      resetFormFields();
      pushNotice('success', 'Creado correctamente');
    } catch (err: any) {
      setError(err.message || String(err));
      pushNotice('error', err.message || String(err));
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setError(null);
    try {
      // Basic validations
      if (entity === 'empresas' && !(empresaNombre || '').trim()) {
        setError('El nombre de la empresa es obligatorio');
        pushNotice('error', 'El nombre de la empresa es obligatorio');
        return;
      }
      if (entity === 'procesos' && !(procesoObjeto || '').trim()) {
        setError('El campo objeto es obligatorio');
        pushNotice('error', 'El campo objeto es obligatorio');
        return;
      }

      // anticipo validation
      if (
        entity === 'procesos' &&
        procesoAnticipo !== '' &&
        (Number(procesoAnticipo) < 0 || Number(procesoAnticipo) > 50)
      ) {
        setError('Anticipo debe estar entre 0 y 50');
        pushNotice('error', 'Anticipo debe estar entre 0 y 50');
        return;
      }

      let payload: any;
      if (entity === 'empresas') {
        payload = { nombre: (empresaNombre ?? '').trim() };
      } else if (entity === 'procesos') {
        payload = {
          objeto: procesoObjeto,
          entidadId: procesoEntidadId || undefined,
          tipoProcesoId: procesoTipoId || undefined,
          estadoId: procesoEstadoId || undefined,
          anticipo:
            procesoAnticipo === '' ? undefined : Number(procesoAnticipo),
          mipyme: procesoMipyme,
          codigoLink: procesoCodigoLink || undefined,
        };
      } else if (entity === 'lotes') {
        const normVal = normalizeDecimalInput(loteValor || null);
        const normPol = normalizeDecimalInput(lotePoliza || null);
        if (normVal && !validateDecimalPrecision(normVal)) {
          setError('Valor excede precisión permitida');
          pushNotice('error', 'Valor excede precisión permitida');
          return;
        }
        if (normPol && !validateDecimalPrecision(normPol)) {
          setError('Póliza excede precisión permitida');
          pushNotice('error', 'Póliza excede precisión permitida');
          return;
        }
        payload = {
          procesoId: loteProcesoId || undefined,
          valor: normVal || undefined,
          poliza: normPol || undefined,
          poliza_real: !!normPol,
        };
      } else if (entity === 'ofertas') {
        payload = {
          loteId: ofertaLoteId || undefined,
          consorcioId: ofertaConsorcioId || undefined,
        };
      } else if (entity === 'entidades') {
        payload = { nombre: entidadNombre || undefined };
      } else if (entity === 'consorcios') {
        payload = { nombre: consorcioNombre || undefined };
      } else if (entity === 'consorcio_empresa') {
        payload = {
          consorcioId: consorcioEmpresaConsorcioId || undefined,
          empresaId: consorcioEmpresaEmpresaId || undefined,
        };
      } else if (entity === 'fecha_proceso') {
        const parsed = parseFechaLocalToISO(fechaProcesoFecha || undefined);
        payload = {
          procesoId: fechaProcesoProcesoId || undefined,
          tipoFechaProcesoId: fechaProcesoTipoId || undefined,
          fecha: parsed || undefined,
        };
      } else if (entity === 'tipo_proceso') {
        payload = { nombre: tipoProcesoNombre || undefined };
      } else if (entity === 'tipo_fecha_proceso') {
        payload = { nombre: tipoFechaProcesoNombre || undefined };
      } else if (entity === 'estado_proceso') {
        payload = { nombre: estadoProcesoNombre || undefined };
      } else {
        payload = JSON.parse(editorValue);
      }
      const idToUse = getId(selected);
      if (!idToUse && idToUse !== 0)
        throw new Error(
          'No se pudo determinar el id del registro a actualizar',
        );

      // Entity routing patterns:
      // - pathPatchEntities: PATCH /api/{entity}/{id}
      // - putQueryIdEntities: PUT /api/{entity}?id={id}
      // - default: PUT /api/{entity} with body { id, ... }
      const pathPatchEntities = new Set(['lotes', 'ofertas', 'fecha_proceso']);
      const putQueryIdEntities = new Set([
        'procesos',
        'tipo_proceso',
        'tipo_fecha_proceso',
      ]);
      let res: Response;
      if (pathPatchEntities.has(entity)) {
        res = await fetch(`${baseUrl}/api/${entity}/${idToUse}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (putQueryIdEntities.has(entity)) {
        // backend handlers for these entities expect id in query params
        const url = `${baseUrl}/api/${entity}?id=${encodeURIComponent(String(idToUse))}`;
        res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const bodyWithId = { id: idToUse, ...payload };
        res = await fetch(`${baseUrl}/api/${entity}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyWithId),
        });
      }
      if (!res.ok) throw new Error('Error al actualizar');
      await fetchItems();
      await refreshRelatedLists();
      setSelected(null);
      setEditorValue('{}');
      resetFormFields();
      pushNotice('success', 'Actualizado correctamente');
    } catch (err: any) {
      setError(err.message || String(err));
      pushNotice('error', err.message || String(err));
    }
  };

  // Validación del formulario por entidad
  const isFormValid = () => {
    switch (entity) {
      case 'empresas':
        return !!(empresaNombre || '').trim();
      case 'procesos':
        if (!(procesoObjeto || '').trim()) return false;
        // anticipo debe ser un número entre 0 y 50 si se proporciona
        if (procesoAnticipo !== '') {
          const n = Number(procesoAnticipo);
          if (Number.isNaN(n) || n < 0 || n > 50) return false;
        }
        return true;
      case 'lotes':
        return true; // optional fields
      case 'ofertas':
        return true;
      case 'entidades':
        return !!(entidadNombre || '').trim();
      case 'consorcios':
        return !!(consorcioNombre || '').trim();
      case 'consorcio_empresa':
        return !!consorcioEmpresaConsorcioId && !!consorcioEmpresaEmpresaId;
      case 'fecha_proceso':
        if (fechaProcesoFecha) {
          const parsed = parseFechaLocalToISO(fechaProcesoFecha);
          if (!parsed) return false;
        }
        return true;
      case 'tipo_proceso':
        return !!(tipoProcesoNombre || '').trim();
      case 'tipo_fecha_proceso':
        return !!(tipoFechaProcesoNombre || '').trim();
      case 'estado_proceso':
        return !!(estadoProcesoNombre || '').trim();
      default:
        try {
          JSON.parse(editorValue);
          return true;
        } catch {
          return false;
        }
    }
  };

  const handleDelete = async (it: any) => {
    // Histórico: se mantiene para la API si se llama directamente
    setError(null);
    try {
      const id = getId(it);
      if (!id && id !== 0) {
        throw new Error('No se pudo determinar el id del registro a eliminar');
      }
      // Preferir los patrones más comunes del backend:
      // - algunas entidades exponen DELETE en /api/{entity}/{id} (lotes, ofertas, fecha_proceso)
      // - la mayoría de las otras leen el id desde query o desde el body JSON
      const idRouteEntities = new Set(['lotes', 'ofertas', 'fecha_proceso']);
      let res: Response;
      if (idRouteEntities.has(entity)) {
        res = await fetch(`${baseUrl}/api/${entity}/${id}`, {
          method: 'DELETE',
        });
      } else {
        // send id both in query and JSON body so route handlers that read either will work
        const url = `${baseUrl}/api/${entity}?id=${encodeURIComponent(String(id))}`;
        res = await fetch(url, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }

      if (!res.ok) {
        // intentar parsear JSON con mensaje de error
        let msg = `Error al eliminar (status ${res.status})`;
        try {
          const body = await res.json();
          if (body && (body.message || body.error))
            msg = String(body.message || body.error);
          else if (body && typeof body === 'string') msg = body;
        } catch {
          try {
            const text = await res.text();
            if (text) msg = text;
          } catch {
            /* ignore */
          }
        }
        throw new Error(msg);
      }
      await fetchItems();
      await refreshRelatedLists();
      pushNotice('success', 'Eliminado correctamente');
    } catch (err: any) {
      setError(err.message || String(err));
      pushNotice('error', err.message || String(err));
    }
  };

  // Estado del modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);

  const requestDelete = (it: any) => {
    setPendingDelete(it);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setConfirmOpen(false);
    await handleDelete(pendingDelete);
    setPendingDelete(null);
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    setConfirmOpen(false);
  };

  const startEdit = (it: any) => {
    setSelected(it);
    setEditorValue(JSON.stringify(it, null, 2));
  };

  useEffect(() => {
    if (!selected) return;
    if (entity === 'empresas') {
      setEmpresaNombre(selected.nombre || '');
    }
    if (entity === 'procesos') {
      setProcesoObjeto(selected.objeto || '');
      setProcesoEntidadId(getRelationId(selected, 'entidad'));
      setProcesoTipoId(getRelationId(selected, 'tipoProceso'));
      setProcesoEstadoId(getRelationId(selected, 'estado'));
      setProcesoAnticipo(selected.anticipo ?? '');
      setProcesoMipyme(!!selected.mipyme);
      setProcesoCodigoLink(selected.codigoLink || '');
    }
    // Otros casos/entidades
    if (entity === 'lotes') {
      setLoteProcesoId(getRelationId(selected, 'proceso'));
      setLoteValor(formatForDisplay(selected.valor ?? ''));
      setLotePoliza(formatForDisplay(selected.poliza ?? ''));
    }
    if (entity === 'ofertas') {
      setOfertaLoteId(getRelationId(selected, 'lote'));
      setOfertaConsorcioId(getRelationId(selected, 'consorcio'));
    }
    if (entity === 'entidades') {
      setEntidadNombre(selected.nombre || '');
    }
    if (entity === 'consorcios') {
      setConsorcioNombre(selected.nombre || '');
    }
    if (entity === 'consorcio_empresa') {
      setConsorcioEmpresaConsorcioId(getRelationId(selected, 'consorcio'));
      setConsorcioEmpresaEmpresaId(getRelationId(selected, 'empresa'));
    }
    if (entity === 'fecha_proceso') {
      setFechaProcesoProcesoId(getRelationId(selected, 'proceso'));
      setFechaProcesoTipoId(getRelationId(selected, 'tipoFechaProceso'));
      setFechaProcesoFecha(selected.fecha || '');
    }
    if (entity === 'tipo_proceso') {
      setTipoProcesoNombre(selected.nombre || '');
    }
    if (entity === 'tipo_fecha_proceso') {
      setTipoFechaProcesoNombre(selected.nombre || '');
    }
    if (entity === 'estado_proceso') {
      setEstadoProcesoNombre(selected.nombre || '');
    }
  }, [selected, entity]);

  // Estado extra para campos específicos por entidad
  const [entidadesList, setEntidadesList] = useState<any[]>([]);

  useEffect(() => {
    // Obtener listas relacionadas usadas por varias entidades
    // Cargar listas relacionadas una vez
    refreshRelatedLists();
  }, [refreshRelatedLists]);

  const renderEditor = () => {
    switch (entity) {
      case 'empresas':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Nombre de la empresa"
              value={empresaNombre}
              onChange={(e) => setEmpresaNombre(e.target.value)}
            />
            {empresaError && (
              <div className="text-sm text-red-600">{empresaError}</div>
            )}
          </div>
        );
      case 'procesos':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Objeto</label>
            <Input
              placeholder="Objeto o descripción del proceso"
              value={procesoObjeto}
              onChange={(e) => setProcesoObjeto(e.target.value)}
            />
            {procesoObjetoError && (
              <div className="text-sm text-red-600">{procesoObjetoError}</div>
            )}
            <label className="text-sm font-medium">Entidad</label>
            <Select
              value={procesoEntidadId ?? ''}
              onChange={(e) =>
                setProcesoEntidadId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">-- Ninguna --</option>
              {entidadesList.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.nombre}
                </option>
              ))}
            </Select>
            <label className="text-sm font-medium">Tipo de proceso</label>
            <Select
              value={procesoTipoId ?? ''}
              onChange={(e) =>
                setProcesoTipoId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">-- Ninguno --</option>
              {tipoProcesoList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Select>
            <label className="text-sm font-medium">Estado</label>
            <Select
              value={procesoEstadoId ?? ''}
              onChange={(e) =>
                setProcesoEstadoId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">-- Ninguno --</option>
              {estadoProcesoList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
            <label className="text-sm font-medium">Anticipo</label>
            <Input
              type="number"
              step={1}
              min={0}
              max={50}
              placeholder="0"
              value={procesoAnticipo as any}
              onChange={(e) => {
                const rawStr = e.target.value;
                if (rawStr === '') return setProcesoAnticipo('');
                const n = Number(rawStr);
                if (Number.isNaN(n)) return setProcesoAnticipo('');
                const intval = Math.trunc(n);
                const clamped = Math.max(0, Math.min(50, intval));
                setProcesoAnticipo(clamped as any);
              }}
            />
            {procesoAnticipoError && (
              <div className="text-sm text-red-600">{procesoAnticipoError}</div>
            )}
            <label className="flex items-center gap-2">
              <Toggle
                checked={procesoMipyme}
                onChange={(v: boolean) => setProcesoMipyme(v)}
                ariaLabel="Mipyme"
              />
              <span>Mipyme</span>
            </label>
            {procesoAnticipoError && (
              <div className="text-sm text-red-600">{procesoAnticipoError}</div>
            )}
            <label className="text-sm font-medium">Código Link</label>
            <Input
              value={procesoCodigoLink}
              onChange={(e) => setProcesoCodigoLink(e.target.value)}
            />
          </div>
        );
      case 'lotes':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Proceso</label>
            <Select
              value={loteProcesoId ?? ''}
              onChange={(e) =>
                setLoteProcesoId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">-- Ninguno --</option>
              {procesosList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.objeto || p.id}
                </option>
              ))}
            </Select>
            <label className="text-sm font-medium">Valor</label>
            <Input
              inputMode="decimal"
              placeholder="Valor del lote"
              value={loteValor}
              onChange={(e) =>
                setLoteValor(formatWithCommaDecimal(e.target.value))
              }
            />
            <label className="text-sm font-medium">Póliza</label>
            <Input
              inputMode="decimal"
              placeholder="Número de póliza"
              value={lotePoliza}
              onChange={(e) =>
                setLotePoliza(formatWithCommaDecimal(e.target.value))
              }
            />
          </div>
        );
      case 'ofertas':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Lote</label>
            <Select
              value={ofertaLoteId ?? ''}
              onChange={(e) =>
                setOfertaLoteId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">-- Ninguno --</option>
              {lotesList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.valor || l.id}
                </option>
              ))}
            </Select>
            <label className="text-sm font-medium">Consorcio</label>
            <Select
              value={ofertaConsorcioId ?? ''}
              onChange={(e) =>
                setOfertaConsorcioId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">-- Ninguno --</option>
              {consorciosList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || c.id}
                </option>
              ))}
            </Select>
          </div>
        );
      case 'entidades':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Nombre de la entidad"
              value={entidadNombre}
              onChange={(e) => setEntidadNombre(e.target.value)}
            />
            {entidadError && (
              <div className="text-sm text-red-600">{entidadError}</div>
            )}
          </div>
        );
      case 'consorcios':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Nombre del consorcio"
              value={consorcioNombre}
              onChange={(e) => setConsorcioNombre(e.target.value)}
            />
            {consorcioError && (
              <div className="text-sm text-red-600">{consorcioError}</div>
            )}
          </div>
        );
      case 'consorcio_empresa':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Consorcio</label>
            <Select
              value={consorcioEmpresaConsorcioId ?? ''}
              onChange={(e) =>
                setConsorcioEmpresaConsorcioId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">-- Ninguno --</option>
              {consorciosList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || c.id}
                </option>
              ))}
            </Select>
            <label className="text-sm font-medium">Empresa</label>
            <Select
              value={consorcioEmpresaEmpresaId ?? ''}
              onChange={(e) =>
                setConsorcioEmpresaEmpresaId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">-- Ninguno --</option>
              {empresasList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre || emp.id}
                </option>
              ))}
            </Select>
            {consorcioEmpresaError && (
              <div className="text-sm text-red-600">
                {consorcioEmpresaError}
              </div>
            )}
          </div>
        );
      case 'fecha_proceso':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Proceso</label>
            <Select
              value={fechaProcesoProcesoId ?? ''}
              onChange={(e) =>
                setFechaProcesoProcesoId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">-- Ninguno --</option>
              {procesosList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.objeto || p.id}
                </option>
              ))}
            </Select>
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={fechaProcesoTipoId ?? ''}
              onChange={(e) =>
                setFechaProcesoTipoId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">-- Ninguno --</option>
              {tipoFechaProcesoList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre || t.id}
                </option>
              ))}
            </Select>
            <label className="text-sm font-medium">Fecha</label>
            <Input
              placeholder="Ej: 2025-10-13 OR 13/10/2025 - 09:00 am"
              value={fechaProcesoFecha}
              onChange={(e) => setFechaProcesoFecha(e.target.value)}
            />
            {fechaProcesoError && (
              <div className="text-sm text-red-600">{fechaProcesoError}</div>
            )}
            {fechaProcesoFecha && !fechaProcesoError && (
              <div className="text-sm text-gray-600">
                Preview: {formatFecha(fechaProcesoFecha)}
              </div>
            )}
          </div>
        );
      case 'tipo_proceso':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Nombre tipo proceso"
              value={tipoProcesoNombre}
              onChange={(e) => setTipoProcesoNombre(e.target.value)}
            />
            {tipoProcesoError && (
              <div className="text-sm text-red-600">{tipoProcesoError}</div>
            )}
          </div>
        );
      case 'tipo_fecha_proceso':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Nombre tipo fecha"
              value={tipoFechaProcesoNombre}
              onChange={(e) => setTipoFechaProcesoNombre(e.target.value)}
            />
            {tipoFechaProcesoError && (
              <div className="text-sm text-red-600">
                {tipoFechaProcesoError}
              </div>
            )}
          </div>
        );
      case 'estado_proceso':
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Nombre estado"
              value={estadoProcesoNombre}
              onChange={(e) => setEstadoProcesoNombre(e.target.value)}
            />
            {estadoProcesoError && (
              <div className="text-sm text-red-600">{estadoProcesoError}</div>
            )}
          </div>
        );
      default:
        return (
          <textarea
            value={editorValue}
            onChange={(e) => setEditorValue(e.target.value)}
            rows={20}
            className="w-full border rounded p-2 font-mono text-sm text-gray-900"
          />
        );
    }
  };

  return (
    <>
      <main className="min-h-screen p-8 bg-black text-white">
        <div className="max-w-6xl mx-auto bg-gray-900/90 rounded shadow-lg p-6 border border-gray-800">
          <h1 className="text-4xl font-extrabold mb-4 text-white drop-shadow-md">
            ADMIN - CRUD
          </h1>

          <div className="mb-4 flex gap-4 items-center">
            <label className="font-medium text-gray-200">Entidad:</label>
            <select
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                resetFormFields();
                setSelected(null);
                setEditorValue('{}');
              }}
              className="border px-2 py-1 text-gray-900 font-semibold bg-white"
            >
              {ENTITIES.map((en) => (
                <option key={en} value={en}>
                  {en}
                </option>
              ))}
            </select>
            <Button onClick={() => fetchItems()} className="ml-2 px-3 py-1">
              Refrescar
            </Button>
            <span className="ml-auto text-sm text-gray-800">
              Items: {items.length}
            </span>
          </div>

          {error && <div className="text-red-600 mb-2">{error}</div>}

          {/* notificación */}
          {notice && (
            <div
              className={`mb-2 p-2 rounded ${notice.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {notice.message}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="mb-2 font-semibold text-gray-200">Listado</div>
              <div className="bg-white text-gray-900 border rounded max-h-96 overflow-auto p-4">
                {loading ? (
                  <div className="p-4">Cargando...</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left text-gray-800 font-semibold">
                          #
                        </th>
                        <th className="p-2 text-left text-gray-800">ID</th>
                        <th className="p-2 text-left text-gray-800">Datos</th>
                        <th className="p-2 text-gray-800">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 align-top text-gray-800 font-semibold">
                            {idx + 1}
                          </td>
                          <td className="p-2 align-top text-gray-700">
                            {String(getId(it) ?? '')}
                          </td>
                          <td className="p-2 align-top">
                            <pre className="text-xs text-gray-800">
                              {JSON.stringify(it, null, 2)}
                            </pre>
                          </td>
                          <td className="p-2 align-top flex gap-2 justify-center">
                            <Button
                              onClick={() => startEdit(it)}
                              variant="warning"
                              className="px-2 py-1"
                            >
                              Editar
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => requestDelete(it)}
                              className="px-2 py-1"
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-white text-gray-900 p-4 rounded shadow-sm border border-gray-200 sticky top-6 max-h-[80vh] overflow-auto">
              <div className="mb-2 text-lg font-semibold text-gray-900">
                Editor
              </div>
              <div className="space-y-4 text-gray-900">
                {renderEditor()}
                {/* Acciones del editor: Crear / Actualizar / Cancelar (alineadas a la derecha) */}
                <div className="mt-4 flex gap-2 justify-end">
                  <Button
                    onClick={handleCreate}
                    disabled={!isFormValid()}
                    variant={isFormValid() ? 'success' : 'secondary'}
                    className="px-3 py-1"
                  >
                    Crear
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={!selected || !isFormValid()}
                    variant={
                      selected && isFormValid() ? 'primary' : 'secondary'
                    }
                    className="px-3 py-1"
                  >
                    Actualizar
                  </Button>
                  {selected && (
                    <Button
                      onClick={() => {
                        setSelected(null);
                        setEditorValue('{}');
                        resetFormFields();
                      }}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Confirm modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Eliminar registro"
        message="¿Deseas eliminar este registro? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
