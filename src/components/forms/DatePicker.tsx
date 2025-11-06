'use client';

// Componente: DatePicker
// Propósito: mostrar un input de solo lectura que abre un selector de fecha
// desplegable (popup) montado en document.body para evitar recortes por
// contenedores con overflow. El componente expone `value` como ISO (YYYY-MM-DD)
// y una callback de acción `onChangeAction` que recibe el ISO seleccionado o cadena vacía.
//
// Estructura del archivo:
// - Imports
// - Helpers a nivel de módulo (parseo/formatos, generación de celdas del mes)
// - Componente principal `DatePicker`

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ---------- Helpers a nivel de módulo (pueden reutilizarse y se mantienen puros)
// Convierte una fecha ISO (YYYY-MM-DD) a un objeto Date local (00:00 hora local)
const parseISODateToLocal = (iso: string) => {
  const parts = String(iso || '').split('-');
  if (parts.length < 3) return new Date();
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return new Date(y, m, d);
};

// Formatea un Date a cadena ISO YYYY-MM-DD
const formatISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Devuelve un array de celdas para el mes: números de día o null (para huecos previos)
const buildDays = (d: Date) => {
  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const startWeek = (first.getDay() + 6) % 7; // Lunes=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < startWeek; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
};

export default function DatePicker({
  value,
  onChangeAction,
  placeholder,
  className,
}: {
  value: string | '';
  // Los componentes cliente de Next esperan que las props de función que son
  // Server Actions usen el sufijo "Action". Renombre los manejadores cuando se
  // pasen desde componentes cliente.
  onChangeAction: (iso: string | '') => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    value ? parseISODateToLocal(value) : new Date(),
  );
  const [pickerMode, setPickerMode] = useState<'days' | 'months' | 'years'>(
    'days',
  );
  const ref = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = e.target as Node;
      // if click is inside the input wrapper or inside the portal popup, ignore
      if (ref.current && ref.current.contains(el)) return;
      if (popupRef.current && popupRef.current.contains(el)) return;
      setOpen(false);
    };
    const tid = window.setTimeout(
      () => document.addEventListener('mousedown', onDoc),
      0,
    );
    return () => {
      clearTimeout(tid);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  useEffect(() => {
    if (!value) return;
    const tid = window.setTimeout(
      () => setVisibleMonth(parseISODateToLocal(value)),
      0,
    );
    return () => clearTimeout(tid);
  }, [value]);

  // Renderiza el popup en document.body y calcula coordenadas absolutas para
  // evitar que sea recortado por contenedores con overflow:hidden (por
  // ejemplo, el panel de filtros).
  useEffect(() => {
    if (!open) {
      // programar la limpieza para evitar llamar a setState de forma síncrona
      // dentro del efecto
      const tid = window.setTimeout(() => setPopupStyle(null), 0);
      return () => clearTimeout(tid);
    }
    const updatePos = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      // elegir un ancho mínimo sensato para que el popup no quede demasiado
      // pequeño en columnas estrechas
      const MIN_PX = 240;
      const desiredWidth = Math.max(rect.width, MIN_PX);
      const viewportW =
        window.innerWidth || document.documentElement.clientWidth;
      // calcular la posición 'left' para que el popup se mantenga dentro del
      // viewport con un margen de 8px
      let left = rect.left + window.scrollX;
      if (left + desiredWidth + 8 > viewportW + window.scrollX) {
        left = Math.max(
          8 + window.scrollX,
          viewportW + window.scrollX - desiredWidth - 8,
        );
      }
      // programar la actualización para evitar setState síncrono dentro de
      // callbacks de efecto
      window.setTimeout(() => {
        setPopupStyle({
          position: 'absolute',
          left,
          top: rect.bottom + window.scrollY + 4,
          width: desiredWidth,
          minWidth: MIN_PX,
          zIndex: 9999,
        });
      }, 0);
    };
    updatePos();
    const onScroll = () => updatePos();
    const onResize = () => updatePos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, visibleMonth]);

  return (
    <div className="relative inline-block" ref={ref}>
      <input
        readOnly
        value={
          value
            ? (() => {
                const d = parseISODateToLocal(value as string);
                return `${String(d.getDate()).padStart(2, '0')}/${String(
                  d.getMonth() + 1,
                ).padStart(2, '0')}/${d.getFullYear()}`;
              })()
            : ''
        }
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'DD/MM/YYYY'}
        className={`${className ?? 'border border-gray-300 px-3 py-2 rounded-md bg-white text-gray-900 w-full'}`}
      />
      {open &&
        createPortal(
          <div
            ref={popupRef}
            style={popupStyle ?? undefined}
            className="bg-white border rounded shadow-lg p-3 z-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerMode('months')}
                  className="text-sm font-medium text-gray-800 hover:underline"
                >
                  {new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(
                    visibleMonth,
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPickerMode('years')}
                  className="text-sm text-gray-800 hover:underline"
                >
                  {visibleMonth.getFullYear()}
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-label="Mes anterior"
                  onClick={() =>
                    setVisibleMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                    )
                  }
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-800"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Mes siguiente"
                  onClick={() =>
                    setVisibleMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                    )
                  }
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-800"
                >
                  ▼
                </button>
              </div>
            </div>

            {pickerMode === 'days' && (
              <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-600 mb-1">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                  <div key={d} className="font-medium">
                    {d}
                  </div>
                ))}
                {buildDays(visibleMonth).map((cell, idx) => {
                  if (!cell)
                    return (
                      <div
                        key={idx}
                        className="h-8 flex items-center justify-center"
                      />
                    );
                  const sel = new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth(),
                    cell as number,
                  );
                  const selISO = formatISO(sel);
                  const isSelected = value && selISO === value;
                  const isToday =
                    sel.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      className="h-8 flex items-center justify-center"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChangeAction(selISO);
                          setOpen(false);
                        }}
                        className={`w-8 h-8 flex items-center justify-center rounded ${isSelected ? 'bg-indigo-600 text-white' : isToday ? 'border rounded' : 'hover:bg-gray-100'}`}
                      >
                        {cell}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {pickerMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 text-sm text-center">
                {Array.from({ length: 12 }).map((_, mi) => {
                  const monthDate = new Date(visibleMonth.getFullYear(), mi, 1);
                  const monthLabel = new Intl.DateTimeFormat('es-ES', {
                    month: 'long',
                  }).format(monthDate);
                  const isCurrentMonth = mi === visibleMonth.getMonth();
                  return (
                    <button
                      key={mi}
                      type="button"
                      onClick={() => {
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), mi, 1),
                        );
                        setPickerMode('days');
                      }}
                      className={`px-2 py-2 rounded ${isCurrentMonth ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
                    >
                      {monthLabel}
                    </button>
                  );
                })}
                <div className="col-span-3 mt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setPickerMode('years')}
                    className="text-xs text-gray-800 hover:underline"
                  >
                    Cambiar año ({visibleMonth.getFullYear()})
                  </button>
                </div>
              </div>
            )}

            {pickerMode === 'years' && (
              <div className="grid grid-cols-4 gap-2 text-sm text-center">
                {Array.from({ length: 2040 - 2020 + 1 }).map((_, i) => {
                  const y = 2020 + i;
                  const isCurrent = y === visibleMonth.getFullYear();
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setVisibleMonth(
                          new Date(y, visibleMonth.getMonth(), 1),
                        );
                        setPickerMode('months');
                      }}
                      className={`px-2 py-2 rounded ${isCurrent ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
