'use client';
import React from 'react';
import Button from './Button';

// Componente modal de confirmación reutilizable
// Props:
// - open: controla si el modal está visible
// - title: título opcional del modal (por defecto 'Confirmar')
// - message: mensaje explicativo (por defecto '¿Estás seguro?')
// - onConfirm: callback ejecutado al confirmar
// - onCancel: callback ejecutado al cancelar
type Props = {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title = 'Confirmar',
  message = '¿Estás seguro?',
  onConfirm,
  onCancel,
}: Props) {
  // No renderizar nada si no está abierto
  if (!open) return null;

  // Overlay semi-transparente centrado con caja blanca
  // Los botones a la derecha permiten cancelar o confirmar la acción
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg max-w-md w-full p-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <Button
            variant="danger"
            onClick={onConfirm}
            className="px-3 py-1"
            autoFocus
          >
            Eliminar
          </Button>
          <Button variant="secondary" onClick={onCancel} className="px-3 py-1">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
