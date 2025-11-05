import { NextRequest, NextResponse } from 'next/server';
import { FechaProcesoService } from '@modules/fecha_proceso/fecha_proceso.service';

let service: FechaProcesoService | null = null;
const getService = () => {
  if (!service) service = new FechaProcesoService();
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
        { error: 'ID de fecha no proporcionado' },
        { status: 400 },
      );

    const id = Number(params.id);
    if (Number.isNaN(id) || id <= 0)
      return NextResponse.json(
        { error: 'ID de fecha inválido' },
        { status: 400 },
      );

    const body = await req.json().catch(() => ({} as any));
    const setTo = !!body.importante;
    const data = await getService().markImportant(id, setTo);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: 'Error al marcar la fecha' },
      { status: 500 },
    );
  }
}
