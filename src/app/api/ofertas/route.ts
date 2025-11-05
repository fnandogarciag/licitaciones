import { NextResponse } from 'next/server';
import { OfertasService } from '@modules/ofertas/ofertas.service';

let service: OfertasService | null = null;
const getService = () => {
  if (!service) service = new OfertasService();
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
  try {
    const body = await req.json();
    // server-side validation: require consorcioId when creating an oferta
    if (
      body == null ||
      body.consorcioId === undefined ||
      body.consorcioId === null
    ) {
      return NextResponse.json(
        { error: 'consorcioId es obligatorio' },
        { status: 400 },
      );
    }
    const data = await getService().create(body);
    return NextResponse.json(data);
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    // return 400 for common validation messages coming from service
    return NextResponse.json({ error: msg }, { status: 400 });
  }
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
