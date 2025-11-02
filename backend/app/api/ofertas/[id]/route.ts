import { NextResponse } from 'next/server';
import { OfertasService } from '@/src/services/ofertas.service';

let service: OfertasService | null = null;
const getService = () => {
  if (!service) service = new OfertasService();
  return service;
};

export async function PATCH(req: Request, { params }: any) {
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const data = await getService().update(id, body);
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: any) {
  const id = Number(params.id);
  const data = await getService().remove(id);
  return NextResponse.json(data);
}
