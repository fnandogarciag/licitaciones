import 'reflect-metadata';
import path from 'path';
import { DataSource, DeepPartial } from 'typeorm';
import type { FechaProceso } from '@/src/entities/fecha_proceso.entity';

export class FechaProcesoService {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = undefined as unknown as DataSource;
  }

  private get repo() {
    return this.dataSource.getRepository('fecha_proceso');
  }

  private async ensureInitialized() {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      const req = eval('require');
      const out = process.env.BUILD_OUTDIR || 'dist';
      const dsModule = req(path.join(process.cwd(), out, 'data-source.js'));
      this.dataSource = dsModule.AppDataSource as DataSource;
      if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    }
  }

  async findAll() {
    await this.ensureInitialized();
    return this.repo.find({
      relations: ['proceso', 'tipoFechaProceso'],
    });
  }

  async findOne(id: number) {
    await this.ensureInitialized();
    return this.repo.findOne({
      where: { id },
      relations: ['proceso', 'tipoFechaProceso'],
    });
  }

  async create(data: Partial<FechaProceso>) {
    await this.ensureInitialized();
    const payload: Partial<FechaProceso> & Record<string, unknown> = {
      ...data,
    };
    const p = payload as Record<string, unknown>;

    if ('procesoId' in p && p['procesoId']) {
      const proc = await this.dataSource
        .getRepository('procesos')
        .findOneBy({ id: p['procesoId'] as number });
      if (!proc) throw new Error('Proceso no encontrado');
      p['proceso'] = { id: p['procesoId'] };
      delete p['procesoId'];
    }

    if ('tipoFechaProcesoId' in p && p['tipoFechaProcesoId']) {
      const tf = await this.dataSource
        .getRepository('tipo_fecha_proceso')
        .findOneBy({ id: p['tipoFechaProcesoId'] as number });
      if (!tf) throw new Error('Tipo de fecha no encontrado');
      p['tipoFechaProceso'] = { id: p['tipoFechaProcesoId'] };
      delete p['tipoFechaProcesoId'];
    }

    // If the payload requests this fecha as `importante`, perform creation inside
    // a transaction and ensure other fechas for the same proceso are unset so
    // the unique partial index is not violated.
    if ((p as any).importante) {
      return this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository('fecha_proceso');

        // determine proceso id from payload if possible
        const procesoIdFromPayload =
          (p as any).proceso?.id ?? (p as any).procesoId ?? null;

        // Insert the entity with importante=false first to avoid unique constraint
        const safePayload = {
          ...p,
          importante: false,
        } as DeepPartial<FechaProceso>;
        const toCreate = repo.create(safePayload);
        const saved = await repo.save(toCreate);

        // Now unset other importantes and set this one to importante=true atomically
        const procesoId =
          procesoIdFromPayload ?? (saved as any).proceso?.id ?? null;
        if (procesoId != null) {
          // unset others for this proceso
          await repo
            .createQueryBuilder()
            .update('fecha_proceso')
            .set({ importante: false })
            .where('proceso_id = :pid', { pid: procesoId })
            .andWhere('id != :id', { id: saved.id })
            .execute();

          // set the created row as importante
          await repo
            .createQueryBuilder()
            .update('fecha_proceso')
            .set({ importante: true })
            .where('id = :id', { id: saved.id })
            .execute();
        }

        return repo.findOne({
          where: { id: saved.id },
          relations: ['proceso', 'tipoFechaProceso'],
        });
      });
    }

    const entity = this.repo.create(payload as DeepPartial<FechaProceso>);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<FechaProceso>) {
    await this.ensureInitialized();
    const existing = await this.repo.findOneBy({ id });
    if (!existing) return null;

    const payload: Record<string, any> = { ...(data as Record<string, any>) };

    if ('procesoId' in payload) {
      const val = payload['procesoId'];
      if (val == null) {
        existing.proceso = null as any;
      } else {
        // validate existence
        const repoProc = this.dataSource.getRepository('procesos');
        const proc = await repoProc.findOneBy({ id: Number(val) });
        if (!proc) throw new Error('Proceso no encontrado');
        payload['proceso'] = { id: Number(val) };
      }
      delete payload['procesoId'];
    }

    if ('tipoFechaProcesoId' in payload) {
      const val = payload['tipoFechaProcesoId'];
      if (val == null) {
        existing.tipoFechaProceso = null as any;
      } else {
        const repoTf = this.dataSource.getRepository('tipo_fecha_proceso');
        const tf = await repoTf.findOneBy({ id: Number(val) });
        if (!tf) throw new Error('Tipo de fecha no encontrado');
        payload['tipoFechaProceso'] = { id: Number(val) };
      }
      delete payload['tipoFechaProcesoId'];
    }

    Object.assign(existing, payload);
    return this.repo.save(existing);
  }

  async remove(id: number) {
    await this.ensureInitialized();
    const e = await this.repo.findOneBy({ id });
    if (!e) return null;
    await this.repo.remove(e as any);
    return e;
  }

  /**
   * Marca una fecha como importante.
   * Si `setTo` es true, desmarca las demás del mismo proceso en una transacción.
   */
  async markImportant(id: number, setTo: boolean) {
    await this.ensureInitialized();

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository('fecha_proceso');
      const target = await repo.findOne({
        where: { id },
        relations: ['proceso'],
      });
      if (!target) return null;

      const procesoId =
        (target as any).proceso?.id ?? (target as any).procesoId ?? null;

      if (setTo) {
        await repo
          .createQueryBuilder()
          .update('fecha_proceso')
          .set({ importante: false })
          .where('proceso_id = :pid', { pid: procesoId })
          .andWhere('id != :id', { id })
          .execute();

        target.importante = true;
        await repo.save(target);
      } else {
        target.importante = false;
        await repo.save(target);
      }

      return repo.findOne({
        where: { id },
        relations: ['proceso', 'tipoFechaProceso'],
      });
    });
  }
}
