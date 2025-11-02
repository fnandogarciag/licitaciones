'use client';
import React from 'react';

// Componente Toggle (switch) accesible
// Props:
// - checked: estado booleano del switch
// - onChange: callback con el nuevo estado cuando se hace click
// - className: clases adicionales opcionales
// - ariaLabel: etiqueta accesible para lectores de pantalla
// Implementación: botón con role="switch" y aria-checked para accesibilidad. Animación simple del knob.
type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  ariaLabel?: string;
};

export default function Toggle({
  checked,
  onChange,
  className = '',
  ariaLabel,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center h-6 w-11 rounded-full p-1 transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'} ${className}`}
    >
      <span
        className={`bg-white w-4 h-4 rounded-full transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}
