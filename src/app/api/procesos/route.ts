import { NextResponse } from 'next/server';
import path from 'path';

let service: any = null;
const getService = () => {
  if (service) return service;
  try {
    // Load the runtime-built service module from disk so Next doesn't bundle it.
    // Use eval('require') to avoid bundlers transforming the require.

    const req = eval('require');
    const out = process.env.BUILD_OUTDIR || 'dist';
    // In the compiled output the service lives under dist/modules/procesos
    const mod = req(
      path.join(
        process.cwd(),
        out,
        'modules',
        'procesos',
        'procesos.service.js',
      ),
    );
    const ServiceClass = mod && (mod.ProcesosService || mod.default);
    service = new ServiceClass();
    return service;
  } catch {
    // As fallback, try to require the compiled module via path alias (may be bundled)

    // @ts-ignore
    const mod = require('@modules/procesos/procesos.service');
    const ServiceClass = mod && (mod.ProcesosService || mod.default);
    service = new ServiceClass();
    return service;
  }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const data = await getService().findOne(Number(id));
      return NextResponse.json(data);
    }

    const data = await getService().findAll();
    return NextResponse.json(data);
  } catch (err: any) {
    /* eslint-disable-next-line no-console */
    console.error('Error en /api/procesos GET:', err && (err.stack || err));
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await getService().create(body);
    return NextResponse.json(data);
  } catch (err: any) {
    /* eslint-disable-next-line no-console */
    console.error('Error en /api/procesos POST:', err && (err.stack || err));
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    const body = await req.json();
    const data = await getService().update(id, body);
    return NextResponse.json(data);
  } catch (err: any) {
    /* eslint-disable-next-line no-console */
    console.error('Error en /api/procesos PUT:', err && (err.stack || err));
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    const data = await getService().remove(id);
    return NextResponse.json(data);
  } catch (err: any) {
    /* eslint-disable-next-line no-console */
    console.error('Error en /api/procesos DELETE:', err && (err.stack || err));
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
