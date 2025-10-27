import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
// require runtime-built data-source at request time
import type { Consorcio } from '@/src/entities/consorcio.entity';

export class ConsorciosService {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = undefined as unknown as DataSource;
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

  private get repo() {
    return this.dataSource.getRepository('consorcios');
  }

  async findAll() {
    await this.ensureInitialized();
    // 'consorcioEmpresas' does not exist on the Consorcio entity; the relation property is named 'empresas'
    return this.repo.find({ relations: ['empresas'] });
  }

  async findOne(id: number) {
    await this.ensureInitialized();
    return this.repo.findOne({
      where: { id },
      relations: ['empresas'],
    });
  }

  async create(data: Partial<Consorcio>) {
    await this.ensureInitialized();
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Consorcio>) {
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
