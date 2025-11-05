import { NextResponse } from 'next/server';
import { EntidadesService } from '@modules/entidades/entidades.service';

let service: EntidadesService | null = null;
const getService = () => {
  if (!service) service = new EntidadesService();
  return service;
};

export async function GET() {
  try {
    const data = await getService().findAll();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await getService().create(body);
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updated = await getService().update(Number(id), data);
    if (!updated)
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const deleted = await getService().remove(Number(id));
    if (!deleted)
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(deleted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
