'use client';
import React from 'react';

// Componente Select reutilizable
// Proporciona estilos uniformes para <select> y acepta todas las props nativas
// Props: acepta children (opciones), atributos nativos y `className` opcional para extender estilos
type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

export default function Select(props: Props) {
  const { className = '', children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`border px-2 py-1 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900 ${className}`}
    >
      {children}
    </select>
  );
}
