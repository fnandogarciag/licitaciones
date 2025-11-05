import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
// Do not import AppDataSource statically; require the runtime-built file from disk at runtime
// to avoid module-alias resolution issues inside the Next server process.
import type { Empresa } from './empresa.entity';

export class EmpresasService {
  private dataSource: DataSource;

  constructor() {
    // lazily loaded
    this.dataSource = undefined as unknown as DataSource;
  }

  private async ensureInitialized() {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      const req = eval('require');
      const out = process.env.BUILD_OUTDIR || 'dist';
      const dsModule = req(path.join(process.cwd(), out, 'data-source.js'));
      this.dataSource = dsModule.AppDataSource as DataSource;
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
    }
  }

  private get repo() {
    return this.dataSource.getRepository('empresas');
  }

  async findAll() {
    await this.ensureInitialized();
    return this.repo.find();
  }

  async findOne(id: number) {
    await this.ensureInitialized();
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Empresa>) {
    await this.ensureInitialized();
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Empresa>) {
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
