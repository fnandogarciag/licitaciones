import 'reflect-metadata';
import path from 'path';
import { DataSource, DeepPartial } from 'typeorm';
// No importar AppDataSource estáticamente (Next podría incluirlo en el bundle durante el build).
// En su lugar, haremos require del módulo construido en runtime desde el disco para que su
// override de inicialización (que carga las entidades desde /app/backend/src/entities)
// se ejecute en el proceso del contenedor.
import type { Proceso } from '@/src/entities/proceso.entity';

// Build output directory used at runtime to require compiled JS (dist)
const OUT = process.env.BUILD_OUTDIR || 'dist';

export class ProcesosService {
  private dataSource: DataSource;

  constructor() {
    // dejar undefined; cargaremos el AppDataSource en runtime de forma lazy
    this.dataSource = undefined as unknown as DataSource;
  }

  private get repo() {
    // OBSOLETO: evitar usar nombres de repositorios como string porque el mapeo
    // de nombre/tabla de la entidad en runtime puede diferir. En su lugar, hacer require
    // de la clase de entidad en runtime (después de inicializar el DataSource) y devolver
    // el repositorio para esa clase.
    const entsDir = path.join(process.cwd(), OUT, 'entities');
    // require the compiled JS entity module
    // prefer named export 'Proceso' or default
    // Note: this method assumes compiled CommonJS/ESM interop exists in /lib
    try {
      const mod = require(path.join(entsDir, 'proceso.entity.js'));
      const ProcesoClass = mod && ((mod.Proceso || mod.default) as any);
      if (ProcesoClass) return this.dataSource.getRepository(ProcesoClass);
    } catch {
      // volver al nombre como string (comportamiento anterior) — esto seguirá fallando
      // si los metadatos no están presentes, pero evita que falle durante el require.
    }
    return this.dataSource.getRepository('procesos');
  }

  private async ensureInitialized() {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      try {
        // Use eval('require') to avoid bundlers statically analyzing this require
        // and to ensure we load the runtime file copied into the container.
        const req = eval('require');
        const dsModule = req(path.join(process.cwd(), OUT, 'data-source.js'));
        this.dataSource = dsModule.AppDataSource as DataSource;
      } catch (err) {
        // El require dinámico del data-source construido en runtime falló.
        // NO intentar usar alias del bundler como '@/lib/data-source' aquí porque
        // no se resuelven en el runtime de Node y ocultarían el error original.
        // Registrar el error original y relanzarlo para que los llamadores vean la causa real.
        // Esto hace que la depuración de problemas de inicio/require (deps faltantes, errores de sintaxis,
        // etc.) sea mucho más fácil dentro de Docker.
        // eslint-disable-next-line no-console
        console.error(
          '[ProcesosService] failed to require runtime data-source:',
          err && ((err as any).stack || err),
        );
        throw err;
      }

      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
    }
  }

  async findAll() {
    await this.ensureInitialized();
    const repo = this.repo;
    return repo.find({
      // Usar los nombres de propiedades definidos en Proceso (entidad, estado, tipoProceso)
      // Incluir relaciones anidadas para que el frontend reciba lotes.ofertas y oferta.consorcio
      relations: [
        'entidad',
        'estado',
        'tipoProceso',
        'fechas',
        'fechas.tipoFechaProceso',
        'lotes',
        'lotes.ofertas',
        'lotes.ofertas.consorcio',
      ],
    });
  }

  async findOne(id: number) {
    await this.ensureInitialized();
    const repo = this.repo;
    return repo.findOne({
      where: { id },
      relations: [
        'entidad',
        'estado',
        'tipoProceso',
        'fechas',
        'fechas.tipoFechaProceso',
        'lotes',
        'lotes.ofertas',
        'lotes.ofertas.consorcio',
      ],
    });
  }

  async create(data: Partial<Proceso>) {
    await this.ensureInitialized();
    const payload = { ...data } as Record<string, unknown>;

    if ('entidadId' in payload && payload['entidadId']) {
      // Try to require the entidad class and use that repo; fall back to string name
      let entidadRepo: any;
      try {
        const mod = require(
          path.join(process.cwd(), OUT, 'entities', 'entidad.entity.js'),
        );
        const EntidadClass = mod && (mod.Entidad || mod.default);
        entidadRepo = EntidadClass
          ? this.dataSource.getRepository(EntidadClass)
          : this.dataSource.getRepository('entidades');
      } catch {
        entidadRepo = this.dataSource.getRepository('entidades');
      }
      const entidad = await entidadRepo.findOneBy({
        id: payload['entidadId'] as number,
      });
      if (!entidad) throw new Error('Entidad no encontrada');
      payload['entidad'] = { id: payload['entidadId'] };
      delete payload['entidadId'];
    }

    // allow setting estado via estadoId on create
    if ('estadoId' in payload && payload['estadoId']) {
      let estadoRepo: any;
      try {
        const mod = require(
          path.join(process.cwd(), OUT, 'entities', 'estado_proceso.entity.js'),
        );
        const EstadoClass = mod && (mod.EstadoProceso || mod.default);
        estadoRepo = EstadoClass
          ? this.dataSource.getRepository(EstadoClass)
          : this.dataSource.getRepository('estado_proceso');
      } catch {
        estadoRepo = this.dataSource.getRepository('estado_proceso');
      }
      const estado = await estadoRepo.findOneBy({
        id: payload['estadoId'] as number,
      });
      if (!estado) throw new Error('Estado no encontrado');
      payload['estado'] = { id: payload['estadoId'] };
      delete payload['estadoId'];
    }

    // allow setting tipoProceso via tipoProcesoId on create
    if ('tipoProcesoId' in payload && payload['tipoProcesoId']) {
      let tipoRepo: any;
      try {
        const mod = require(
          path.join(process.cwd(), OUT, 'entities', 'tipo_proceso.entity.js'),
        );
        const TipoClass = mod && (mod.TipoProceso || mod.default);
        tipoRepo = TipoClass
          ? this.dataSource.getRepository(TipoClass)
          : this.dataSource.getRepository('tipo_proceso');
      } catch {
        tipoRepo = this.dataSource.getRepository('tipo_proceso');
      }
      const tipo = await tipoRepo.findOneBy({
        id: payload['tipoProcesoId'] as number,
      });
      if (!tipo) throw new Error('Tipo de proceso no encontrado');
      payload['tipoProceso'] = { id: payload['tipoProcesoId'] };
      delete payload['tipoProcesoId'];
    }

    const repo = this.repo;
    const entity = repo.create(payload as DeepPartial<Proceso>);
    return repo.save(entity);
  }

  async update(id: number, data: Partial<Proceso>) {
    await this.ensureInitialized();
    const repo = this.repo;
    const existing = await repo.findOneBy({ id });
    if (!existing) return null;
    const payload: Record<string, any> = { ...(data as Record<string, any>) };

    // Support updating relations via *_Id fields (entidadId, estadoId, tipoProcesoId)
    // similar to create(). Convert them to relation objects before assigning.
    if ('entidadId' in payload) {
      const val = payload['entidadId'];
      if (val == null) {
        // unset relation
        existing.entidad = null as any;
      } else {
        // validate existencia y asignar referencia parcial
        let entidadRepo: any;
        try {
          const mod = require(
            path.join(process.cwd(), OUT, 'entities', 'entidad.entity.js'),
          );
          const EntidadClass = mod && (mod.Entidad || mod.default);
          entidadRepo = EntidadClass
            ? this.dataSource.getRepository(EntidadClass)
            : this.dataSource.getRepository('entidades');
        } catch {
          entidadRepo = this.dataSource.getRepository('entidades');
        }
        const entidad = await entidadRepo.findOneBy({ id: Number(val) });
        if (!entidad) throw new Error('Entidad no encontrada');
        // assign partial relation and remove helper id so it's not copied over
        existing.entidad = { id: Number(val) } as any;
        delete payload.entidadId;
      }
    }

    if ('estadoId' in payload) {
      const val = payload['estadoId'];
      if (val == null) {
        existing.estado = null as any;
        delete payload.estadoId;
      } else {
        let estadoRepo: any;
        try {
          const mod = require(
            path.join(
              process.cwd(),
              OUT,
              'entities',
              'estado_proceso.entity.js',
            ),
          );
          const EstadoClass = mod && (mod.EstadoProceso || mod.default);
          estadoRepo = EstadoClass
            ? this.dataSource.getRepository(EstadoClass)
            : this.dataSource.getRepository('estado_proceso');
        } catch {
          estadoRepo = this.dataSource.getRepository('estado_proceso');
        }
        const estado = await estadoRepo.findOneBy({ id: Number(val) });
        if (!estado) throw new Error('Estado no encontrado');
        existing.estado = { id: Number(val) } as any;
        delete payload.estadoId;
      }
    }

    if ('tipoProcesoId' in payload) {
      const val = payload['tipoProcesoId'];
      if (val == null) {
        existing.tipoProceso = null as any;
        delete payload.tipoProcesoId;
      } else {
        let tipoRepo: any;
        try {
          const mod = require(
            path.join(process.cwd(), OUT, 'entities', 'tipo_proceso.entity.js'),
          );
          const TipoClass = mod && (mod.TipoProceso || mod.default);
          tipoRepo = TipoClass
            ? this.dataSource.getRepository(TipoClass)
            : this.dataSource.getRepository('tipo_proceso');
        } catch {
          tipoRepo = this.dataSource.getRepository('tipo_proceso');
        }
        const tipo = await tipoRepo.findOneBy({ id: Number(val) });
        if (!tipo) throw new Error('Tipo de proceso no encontrado');
        existing.tipoProceso = { id: Number(val) } as any;
        delete payload.tipoProcesoId;
      }
    }

    // assign remaining scalar fields and save
    Object.assign(existing, payload);
    return repo.save(existing);
  }
}
