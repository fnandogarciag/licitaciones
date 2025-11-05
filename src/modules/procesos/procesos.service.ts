import { DataSource, DeepPartial } from 'typeorm';
import { Proceso } from './proceso.entity';
import { AppDataSource } from '../../config/data-source';
import { Entidad } from '../entidades/entidad.entity';
import { EstadoProceso } from '../estado_proceso/estado_proceso.entity';
import { TipoProceso } from '../tipo_proceso/tipo_proceso.entity';

export class ProcesosService {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = AppDataSource;
  }

  private get repo() {
    return this.dataSource.getRepository(Proceso);
  }

  private async ensureInitialized() {
    if (!this.dataSource.isInitialized) {
      try {
        await this.dataSource.initialize();
      } catch (err: any) {
        console.error(
          'Error inicializando la base de datos en ProcesosService:',
          err,
        );
        throw err;
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
      const entidadRepo = this.dataSource.getRepository(Entidad);
      const entidad = await entidadRepo.findOneBy({
        id: payload['entidadId'] as number,
      });
      if (!entidad) throw new Error('Entidad no encontrada');
      payload['entidad'] = { id: payload['entidadId'] as number };
      delete payload['entidadId'];
    }

    if ('estadoId' in payload && payload['estadoId']) {
      const estadoRepo = this.dataSource.getRepository(EstadoProceso);
      const estado = await estadoRepo.findOneBy({
        id: payload['estadoId'] as number,
      });
      if (!estado) throw new Error('Estado no encontrado');
      payload['estado'] = { id: payload['estadoId'] as number };
      delete payload['estadoId'];
    }

    if ('tipoProcesoId' in payload && payload['tipoProcesoId']) {
      const tipoRepo = this.dataSource.getRepository(TipoProceso);
      const tipo = await tipoRepo.findOneBy({
        id: payload['tipoProcesoId'] as number,
      });
      if (!tipo) throw new Error('Tipo de proceso no encontrado');
      payload['tipoProceso'] = { id: payload['tipoProcesoId'] as number };
      delete payload['tipoProcesoId'];
    }

    const entity = this.repo.create(payload as DeepPartial<Proceso>);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Proceso>) {
    await this.ensureInitialized();
    const existing = await this.repo.findOneBy({ id });
    if (!existing) return null;

    const payload: Record<string, any> = { ...(data as Record<string, any>) };

    if ('entidadId' in payload) {
      const val = payload['entidadId'];
      if (val == null) {
        existing.entidad = null as any;
      } else {
        const entidadRepo = this.dataSource.getRepository(Entidad);
        const entidad = await entidadRepo.findOneBy({ id: Number(val) });
        if (!entidad) throw new Error('Entidad no encontrada');
        existing.entidad = { id: Number(val) } as any;
      }
      delete payload.entidadId;
    }

    if ('estadoId' in payload) {
      const val = payload['estadoId'];
      if (val == null) {
        existing.estado = null as any;
      } else {
        const estadoRepo = this.dataSource.getRepository(EstadoProceso);
        const estado = await estadoRepo.findOneBy({ id: Number(val) });
        if (!estado) throw new Error('Estado no encontrado');
        existing.estado = { id: Number(val) } as any;
      }
      delete payload.estadoId;
    }

    if ('tipoProcesoId' in payload) {
      const val = payload['tipoProcesoId'];
      if (val == null) {
        existing.tipoProceso = null as any;
      } else {
        const tipoRepo = this.dataSource.getRepository(TipoProceso);
        const tipo = await tipoRepo.findOneBy({ id: Number(val) });
        if (!tipo) throw new Error('Tipo de proceso no encontrado');
        existing.tipoProceso = { id: Number(val) } as any;
      }
      delete payload.tipoProcesoId;
    }

    Object.assign(existing, payload);
    return this.repo.save(existing);
  }
}
