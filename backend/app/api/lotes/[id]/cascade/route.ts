import { NextResponse } from 'next/server';
import { LotesService } from '@/src/services/lotes.service';

let service: LotesService | null = null;
const getService = () => {
  if (!service) service = new LotesService();
  return service;
};

export async function DELETE(req: Request, { params }: any) {
  const id = Number(params.id);
  const data = await getService().removeCascade(id);
  return NextResponse.json(data);
}
