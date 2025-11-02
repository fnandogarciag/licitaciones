import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import type { TipoFechaProceso } from '@/src/entities/tipo_fecha_proceso.entity';

export class TipoFechaProcesoService {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = undefined as unknown as DataSource;
  }

  private get repo() {
    return this.dataSource.getRepository('tipo_fecha_proceso');
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
    return this.repo.find();
  }

  async findOne(id: number) {
    await this.ensureInitialized();
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<TipoFechaProceso>) {
    await this.ensureInitialized();
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<TipoFechaProceso>) {
    await this.ensureInitialized();
    const existing = await this.repo.findOneBy({ id });
    if (!existing) return null;
    Object.assign(existing, data);
    return this.repo.save(existing);
  }

  async remove(id: number) {
    await this.ensureInitialized();
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    await this.repo.remove(entity);
    return entity;
  }
}
