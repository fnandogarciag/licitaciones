import { NextRequest, NextResponse } from 'next/server';
import { OfertasService } from '@modules/ofertas/ofertas.service';

let service: OfertasService | null = null;
const getService = () => {
  if (!service) service = new OfertasService();
  return service;
};

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    if (!params?.id)
      return NextResponse.json(
        { error: 'ID de oferta no proporcionado' },
        { status: 400 },
      );

    const id = Number(params.id);
    if (Number.isNaN(id) || id <= 0)
      return NextResponse.json(
        { error: 'ID de oferta inválido' },
        { status: 400 },
      );

    const body = await req.json().catch(() => ({}));
    const data = await getService().update(id, body);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: 'Error al actualizar la oferta' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    if (!params?.id)
      return NextResponse.json(
        { error: 'ID de oferta no proporcionado' },
        { status: 400 },
      );

    const id = Number(params.id);
    if (Number.isNaN(id) || id <= 0)
      return NextResponse.json(
        { error: 'ID de oferta inválido' },
        { status: 400 },
      );

    const data = await getService().remove(id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: 'Error al eliminar la oferta' },
      { status: 500 },
    );
  }
}
