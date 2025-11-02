'use client';
import React from 'react';

// Componente Input reutilizable
// Proporciona estilos consistentes para inputs de texto/número
// Props: acepta todas las props nativas de <input> y un `className` opcional para extender estilos
type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export default function Input(props: Props) {
  const { className = '', ...rest } = props;
  // Aplica clases por defecto (borde, padding, focus ring) y permite extender con className
  return (
    <input
      {...rest}
      className={`border px-2 py-1 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900 ${className}`}
    />
  );
}
