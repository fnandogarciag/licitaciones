import { NextRequest, NextResponse } from 'next/server';
import { LotesService } from '@modules/lotes/lotes.service';

let service: LotesService | null = null;
const getService = () => {
  if (!service) service = new LotesService();
  return service;
};

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    if (
      !params?.id ||
      !Number.isFinite(Number(params.id)) ||
      Number(params.id) <= 0
    ) {
      return NextResponse.json({ error: 'Error' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    if ('id' in body) delete (body as any).id;

    const data = await getService().update(Number(params.id), body as any);
    if (!data) {
      return NextResponse.json({ error: 'Error' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    if (
      !params?.id ||
      !Number.isFinite(Number(params.id)) ||
      Number(params.id) <= 0
    ) {
      return NextResponse.json({ error: 'Error' }, { status: 400 });
    }

    const data = await getService().remove(Number(params.id));
    if (!data) {
      return NextResponse.json({ error: 'Error' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
