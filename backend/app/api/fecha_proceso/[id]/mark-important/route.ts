import { NextResponse } from 'next/server';
import { FechaProcesoService } from '@/src/services/fecha_proceso.service';

let service: FechaProcesoService | null = null;
const getService = () => {
  if (!service) service = new FechaProcesoService();
  return service;
};

export async function PATCH(req: Request, { params }: any) {
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}) as any);
  const setTo = !!body.importante;
  const data = await getService().markImportant(id, setTo);
  return NextResponse.json(data);
}
