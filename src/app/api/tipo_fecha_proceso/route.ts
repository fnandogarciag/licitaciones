import { NextResponse } from 'next/server';
import { TipoFechaProcesoService } from '@modules/tipo_fecha_proceso/tipo_fecha_proceso.service';

let service: TipoFechaProcesoService | null = null;
const getService = () => {
  if (!service) service = new TipoFechaProcesoService();
  return service;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const data = await getService().findOne(Number(id));
    return NextResponse.json(data);
  }

  const data = await getService().findAll();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = await getService().create(body);
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  const body = await req.json();
  const data = await getService().update(id, body);
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  const data = await getService().remove(id);
  return NextResponse.json(data);
}
