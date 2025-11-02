import { NextResponse } from 'next/server';
import { FechaProcesoService } from '@/src/services/fecha_proceso.service';

let service: FechaProcesoService | null = null;
const getService = () => {
  if (!service) service = new FechaProcesoService();
  return service;
};

export async function PATCH(req: Request, { params }: any) {
  const id = Number(params.id);
  // soportar tanto patch basado en body (update) como /mark-important manejado por separado
  const body = await req.json().catch(() => ({}));
  // Si el body contiene 'importante' y se usó el path, tratar como update
  if ('importante' in body || Object.keys(body).length > 0) {
    // delegar al update (parcial)
    const data = await getService().update(id, body);
    return NextResponse.json(data);
  }
  return NextResponse.json(null);
}

export async function DELETE(req: Request, { params }: any) {
  const id = Number(params.id);
  const data = await getService().remove(id);
  return NextResponse.json(data);
}
