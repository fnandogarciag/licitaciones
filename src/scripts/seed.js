/* eslint-disable */
/* eslint-env node */
/* eslint-disable no-undef */
const path = require('path');

function firstClass(mod) {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (mod && typeof mod === 'object') {
    if (mod.default && typeof mod.default === 'function') return mod.default;
    for (const k of Object.keys(mod)) {
      const v = mod[k];
      if (typeof v === 'function') return v;
    }
  }
  return null;
}

async function run() {
  const base = process.cwd();
  const out = process.env.BUILD_OUTDIR || 'dist';
  try {
    const dsMod = require(path.join(base, out, 'config', 'data-source.js'));
    const AppDataSource =
      dsMod && (dsMod.AppDataSource || dsMod.default || dsMod);
    if (!AppDataSource) throw new Error('AppDataSource not found');

    const Entidad = firstClass(
      require(path.join(base, out, 'modules/entidades', 'entidad.entity.js')),
    );
    const EstadoProceso = firstClass(
      require(path.join(
        base,
        out,
        'modules/estado_proceso',
        'estado_proceso.entity.js',
      )),
    );
    const TipoProceso = firstClass(
      require(path.join(
        base,
        out,
        'modules/tipo_proceso',
        'tipo_proceso.entity.js',
      )),
    );
    const TipoFechaProceso = firstClass(
      require(path.join(
        base,
        out,
        'modules/tipo_fecha_proceso',
        'tipo_fecha_proceso.entity.js',
      )),
    );
    const Proceso = firstClass(
      require(path.join(base, out, 'modules/procesos', 'proceso.entity.js')),
    );
    const FechaProceso = firstClass(
      require(path.join(
        base,
        out,
        'modules/fecha_proceso',
        'fecha_proceso.entity.js',
      )),
    );
    const Lote = firstClass(
      require(path.join(base, out, 'modules/lotes', 'lote.entity.js')),
    );
    const Consorcio = firstClass(
      require(path.join(
        base,
        out,
        'modules/consorcios',
        'consorcio.entity.js',
      )),
    );
    const Empresa = firstClass(
      require(path.join(base, out, 'modules/empresas', 'empresa.entity.js')),
    );
    const ConsorcioEmpresa = firstClass(
      require(path.join(
        base,
        out,
        'modules/consorcio_empresa',
        'consorcio_empresa.entity.js',
      )),
    );
    const Oferta = firstClass(
      require(path.join(base, out, 'modules/ofertas', 'oferta.entity.js')),
    );

    await AppDataSource.initialize();
    const ds = AppDataSource;

    const entidadRepo = ds.getRepository(Entidad);
    const estadoRepo = ds.getRepository(EstadoProceso);
    const tipoRepo = ds.getRepository(TipoProceso);
    const tipoFechaRepo = ds.getRepository(TipoFechaProceso);
    const procesoRepo = ds.getRepository(Proceso);
    const fechaRepo = ds.getRepository(FechaProceso);
    const loteRepo = ds.getRepository(Lote);
    const consorcioRepo = ds.getRepository(Consorcio);
    const empresaRepo = ds.getRepository(Empresa);
    const ceRepo = ds.getRepository(ConsorcioEmpresa);
    const ofertaRepo = ds.getRepository(Oferta);

    await ofertaRepo.createQueryBuilder().delete().execute();
    await ceRepo.createQueryBuilder().delete().execute();
    await consorcioRepo.createQueryBuilder().delete().execute();
    await empresaRepo.createQueryBuilder().delete().execute();
    await loteRepo.createQueryBuilder().delete().execute();
    await fechaRepo.createQueryBuilder().delete().execute();
    await procesoRepo.createQueryBuilder().delete().execute();
    await tipoFechaRepo.createQueryBuilder().delete().execute();
    await tipoRepo.createQueryBuilder().delete().execute();
    await estadoRepo.createQueryBuilder().delete().execute();
    await entidadRepo.createQueryBuilder().delete().execute();

    const e1 = await entidadRepo.save(
      entidadRepo.create({ nombre: 'Entidad Demo' }),
    );
    const st1 = await estadoRepo.save(
      estadoRepo.create({ nombre: 'Publicado' }),
    );
    const tp1 = await tipoRepo.save(tipoRepo.create({ nombre: 'Licitación' }));
    const tf1 = await tipoFechaRepo.save(
      tipoFechaRepo.create({ nombre: 'Apertura' }),
    );

    const p1 = await procesoRepo.save(
      procesoRepo.create({
        objeto: 'Construcción de prueba',
        entidad: e1,
        anticipo: 10,
        mipyme: false,
        estado: st1,
        tipoProceso: tp1,
      }),
    );

    await fechaRepo.save(
      fechaRepo.create({
        proceso: p1,
        tipoFechaProceso: tf1,
        fecha: new Date(),
      }),
    );

    const l1 = await loteRepo.save(
      loteRepo.create({
        proceso: p1,
        valor: 12345.67,
        poliza: 100.0,
        poliza_real: false,
      }),
    );
    const c1 = await consorcioRepo.save(
      consorcioRepo.create({ nombre: 'Consorcio A' }),
    );
    const emp1 = await empresaRepo.save(
      empresaRepo.create({ nombre: 'Empresa Uno' }),
    );

    await ceRepo.save(ceRepo.create({ consorcio: c1, empresa: emp1 }));
    await ofertaRepo.save(ofertaRepo.create({ lote: l1, consorcio: c1 }));

    console.log('Seed finished');
    await ds.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err && (err.stack || err));
    process.exit(1);
  }
}

run();
