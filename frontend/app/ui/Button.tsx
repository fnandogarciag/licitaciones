'use client';

import React from 'react';
import Link from 'next/link';

type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
  icon?: React.ReactNode;
  as?: 'button' | 'a';
  loading?: boolean;
  iconPosition?: 'left' | 'right';
  disabledTooltip?: string;
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  href,
  icon,
  as = 'button',
  loading = false,
  iconPosition = 'left',
  disabledTooltip,
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1';
  const variants: Record<Variant, string> = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400',
    secondary:
      'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 focus-visible:ring-indigo-300',
    ghost:
      'bg-transparent text-indigo-600 hover:text-indigo-800 focus-visible:ring-indigo-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400',
    success:
      'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-400',
    warning:
      'bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-300',
  };
  const cls = `${base} ${variants[variant]} ${className}`;

  const iconNode = loading ? (
    <span
      className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
      aria-hidden="true"
    />
  ) : (
    icon
  );

  const isDisabled = Boolean(loading || (rest as any).disabled);
  // Helper para envolver con tooltip cuando está deshabilitado. Al envolver,
  // añadimos también `pointer-events-none` al elemento interactivo interno para
  // que el span envolvente pueda recibir el hover y mostrar el título nativo
  // (los elementos deshabilitados suelen bloquear los eventos de puntero en
  // sus padres).
  const wrapIfTooltip = (node: React.ReactNode) => {
    if (isDisabled && disabledTooltip) {
      const wrapper = (
        <span title={disabledTooltip} className="inline-block">
          {node}
        </span>
      );
      return wrapper;
    }
    return node;
  };

  // Render as link if href provided (next/link)
  if (href) {
    const inner = (
      <Link
        href={href}
        className={
          isDisabled && disabledTooltip ? `${cls} pointer-events-none` : cls
        }
        {...(rest as any)}
      >
        {iconPosition === 'left' && iconNode}
        {children}
        {iconPosition === 'right' && iconNode}
      </Link>
    );
    return wrapIfTooltip(inner);
  }

  if (as === 'a' && (rest as any)['href']) {
    // permitir renderizar como <a> cuando se proporciona `href`
    const { href: h, ...r } = rest as any;
    const inner = (
      <a
        className={
          isDisabled && disabledTooltip ? `${cls} pointer-events-none` : cls
        }
        href={h}
        {...r}
      >
        {iconPosition === 'left' && iconNode}
        {children}
        {iconPosition === 'right' && iconNode}
      </a>
    );
    return wrapIfTooltip(inner);
  }

  const buttonNode = (
    <button
      className={
        isDisabled && disabledTooltip ? `${cls} pointer-events-none` : cls
      }
      disabled={loading || (rest as any).disabled}
      {...rest}
    >
      {iconPosition === 'left' && iconNode}
      {children}
      {iconPosition === 'right' && iconNode}
    </button>
  );

  return wrapIfTooltip(buttonNode);
}
