import 'reflect-metadata';
import path from 'path';
import { DataSource, DeepPartial } from 'typeorm';
import type { ConsorcioEmpresa } from '@/src/entities/consorcio_empresa.entity';

export class ConsorcioEmpresaService {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = undefined as unknown as DataSource;
  }

  private get repo() {
    return this.dataSource.getRepository('consorcio_empresa');
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
    return this.repo.find({ relations: ['consorcio', 'empresa'] });
  }

  async findOne(id: number) {
    await this.ensureInitialized();
    return this.repo.findOne({
      where: { id },
      relations: ['consorcio', 'empresa'],
    });
  }

  async create(data: Partial<ConsorcioEmpresa>) {
    await this.ensureInitialized();

    const payload = { ...data } as Record<string, unknown>;

    if ('consorcioId' in payload && payload['consorcioId']) {
      const cons = await this.dataSource
        .getRepository('consorcios')
        .findOneBy({ id: payload['consorcioId'] as number });
      if (!cons) throw new Error('Consorcio no encontrado');
      payload['consorcio'] = { id: payload['consorcioId'] };
      delete payload['consorcioId'];
    }

    if ('empresaId' in payload && payload['empresaId']) {
      const emp = await this.dataSource
        .getRepository('empresas')
        .findOneBy({ id: payload['empresaId'] as number });
      if (!emp) throw new Error('Empresa no encontrada');
      payload['empresa'] = { id: payload['empresaId'] };
      delete payload['empresaId'];
    }

    const entity = this.repo.create(payload as DeepPartial<ConsorcioEmpresa>);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<ConsorcioEmpresa>) {
    await this.ensureInitialized();

    const existing = await this.repo.findOneBy({ id });
    if (!existing) return null;

    const payload = { ...data } as Record<string, unknown>;

    if ('consorcioId' in payload && payload['consorcioId']) {
      const cons = await this.dataSource
        .getRepository('consorcios')
        .findOneBy({ id: payload['consorcioId'] as number });
      if (!cons) throw new Error('Consorcio no encontrado');
      payload['consorcio'] = { id: payload['consorcioId'] };
      delete payload['consorcioId'];
    }

    if ('empresaId' in payload && payload['empresaId']) {
      const emp = await this.dataSource
        .getRepository('empresas')
        .findOneBy({ id: payload['empresaId'] as number });
      if (!emp) throw new Error('Empresa no encontrada');
      payload['empresa'] = { id: payload['empresaId'] };
      delete payload['empresaId'];
    }

    Object.assign(existing, payload);
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
