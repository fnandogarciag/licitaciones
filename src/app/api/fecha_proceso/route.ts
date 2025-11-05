import { NextResponse } from 'next/server';
import { FechaProcesoService } from '@modules/fecha_proceso/fecha_proceso.service';

let service: FechaProcesoService | null = null;
const getService = () => {
  if (!service) service = new FechaProcesoService();
  return service;
};

/**
 * GET /api/fecha_proceso?id=1  → obtener una
 * GET /api/fecha_proceso       → obtener todas
 */
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

/**
 * POST /api/fecha_proceso
 * body: { ... }
 */
export async function POST(req: Request) {
  const body = await req.json();
  const data = await getService().create(body);
  return NextResponse.json(data);
}

/**
 * PUT /api/fecha_proceso?id=1
 * body: { ... }
 */
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  const body = await req.json();
  const data = await getService().update(id, body);
  return NextResponse.json(data);
}

/**
 * DELETE /api/fecha_proceso?id=1
 */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  const data = await getService().remove(id);
  return NextResponse.json(data);
}

/**
 * PATCH /api/fecha_proceso?id=1&important=true|false
 * → marca o desmarca una fecha como importante
 */
export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  const important = searchParams.get('important') === 'true';

  const data = await getService().markImportant(id, important);
  return NextResponse.json(data);
}
