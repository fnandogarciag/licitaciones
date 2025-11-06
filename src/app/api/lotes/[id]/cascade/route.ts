import { NextRequest, NextResponse } from 'next/server';
import { LotesService } from '@modules/lotes/lotes.service';

let service: LotesService | null = null;
const getService = () => {
  if (!service) service = new LotesService();
  return service;
};

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    if (!params?.id) {
      return NextResponse.json(
        { error: 'ID de lote no proporcionado' },
        { status: 400 },
      );
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID de lote debe ser un número positivo' },
        { status: 400 },
      );
    }

    const service = getService();
    const data = await service.removeCascade(id);

    if (!data) {
      return NextResponse.json(
        { error: 'Lote no encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar el lote' },
      { status: 500 },
    );
  }
}
