import 'reflect-metadata';
import path from 'path';
import { DataSource, DeepPartial } from 'typeorm';
import type { Lote } from '@/src/entities/lote.entity';

export class LotesService {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = undefined as unknown as DataSource;
  }

  private get repo() {
    return this.dataSource.getRepository('lotes');
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
      relations: ['proceso', 'ofertas', 'ofertas.consorcio'],
    });
  }

  async findOne(id: number) {
    await this.ensureInitialized();
    return this.repo.findOne({
      where: { id },
      relations: ['proceso', 'ofertas', 'ofertas.consorcio'],
    });
  }

  async create(data: Partial<Lote>) {
    await this.ensureInitialized();
    const payload = { ...(data as Record<string, unknown>) };

    if ('procesoId' in payload && payload['procesoId']) {
      const proc = await this.dataSource
        .getRepository('procesos')
        .findOneBy({ id: payload['procesoId'] as number });
      if (!proc) throw new Error('Proceso no encontrado');
      payload['proceso'] = { id: payload['procesoId'] };
      delete payload['procesoId'];
    }

    const entity = this.repo.create(payload as DeepPartial<Lote>);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Lote>) {
    await this.ensureInitialized();
    const existing = await this.repo.findOneBy({ id });
    if (!existing) return null;

    const payload: Record<string, any> = { ...(data as Record<string, any>) };

    if ('procesoId' in payload) {
      const val = payload['procesoId'];
      if (val == null) {
        existing.proceso = null as any;
        delete payload.procesoId;
      } else {
        const proc = await this.dataSource
          .getRepository('procesos')
          .findOneBy({ id: Number(val) });
        if (!proc) throw new Error('Proceso no encontrado');
        payload.proceso = { id: Number(val) };
        delete payload.procesoId;
      }
    }

    Object.assign(existing, payload);
    return this.repo.save(existing);
  }

  async remove(id: number) {
    await this.ensureInitialized();
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    await this.repo.remove(entity as any);
    return entity;
  }

  /**
   * Remove lote and related ofertas inside a transaction.
   */
  async removeCascade(id: number) {
    await this.ensureInitialized();
    return this.dataSource.transaction(async (manager) => {
      const ofertasRepo = manager.getRepository('ofertas');
      // delete ofertas for this lote
      await ofertasRepo
        .createQueryBuilder()
        .delete()
        .from('ofertas')
        .where('lote_id = :lid', { lid: id })
        .execute();

      const repo = manager.getRepository('lotes');
      const target = await repo.findOneBy({ id });
      if (!target) return null;
      await repo.remove(target as any);
      return target;
    });
  }
}
