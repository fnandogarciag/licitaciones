import 'reflect-metadata';
import path from 'path';
import { DataSource, DeepPartial } from 'typeorm';
import type { Oferta } from '@/src/entities/oferta.entity';

export class OfertasService {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = undefined as unknown as DataSource;
  }

  private get repo() {
    return this.dataSource.getRepository('ofertas');
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
    // La entidad Oferta se relaciona con lote y consorcio
    return this.repo.find({ relations: ['lote', 'consorcio'] });
  }

  async findOne(id: number) {
    await this.ensureInitialized();
    return this.repo.findOne({
      where: { id },
      relations: ['lote', 'consorcio'],
    });
  }

  async create(data: Partial<Oferta>) {
    await this.ensureInitialized();
    const payload = { ...data } as Record<string, unknown>;

    // eliminado el manejo de campos no relacionados (procesoId/empresaId)

    if ('loteId' in payload && payload['loteId']) {
      const lote = await this.dataSource
        .getRepository('lotes')
        .findOneBy({ id: payload['loteId'] as number });
      if (!lote) throw new Error('Lote no encontrado');
      payload['lote'] = { id: payload['loteId'] };
      delete payload['loteId'];
    }

    if ('consorcioId' in payload && payload['consorcioId']) {
      const cons = await this.dataSource
        .getRepository('consorcios')
        .findOneBy({ id: payload['consorcioId'] as number });
      if (!cons) throw new Error('Consorcio no encontrado');
      payload['consorcio'] = { id: payload['consorcioId'] };
      delete payload['consorcioId'];
    }

    const entity = this.repo.create(payload as DeepPartial<Oferta>);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Oferta>) {
    await this.ensureInitialized();
    const existing = await this.repo.findOneBy({ id });
    if (!existing) return null;

    const payload: Record<string, any> = { ...(data as Record<string, any>) };

    // soportar actualización de relaciones mediante campos *_Id
    if ('consorcioId' in payload) {
      const val = payload['consorcioId'];
      if (val == null) {
        existing.consorcio = null as any;
      } else {
        const cons = await this.dataSource
          .getRepository('consorcios')
          .findOneBy({ id: Number(val) });
        if (!cons) throw new Error('Consorcio no encontrado');
        payload['consorcio'] = { id: Number(val) };
      }
      delete payload['consorcioId'];
    }

    if ('loteId' in payload) {
      const val = payload['loteId'];
      if (val == null) {
        existing.lote = null as any;
      } else {
        const lote = await this.dataSource
          .getRepository('lotes')
          .findOneBy({ id: Number(val) });
        if (!lote) throw new Error('Lote no encontrado');
        payload['lote'] = { id: Number(val) };
      }
      delete payload['loteId'];
    }

    if ('empresaId' in payload) {
      const val = payload['empresaId'];
      if (val == null) {
        existing.empresa = null as any;
      } else {
        const emp = await this.dataSource
          .getRepository('empresas')
          .findOneBy({ id: Number(val) });
        if (!emp) throw new Error('Empresa no encontrada');
        payload['empresa'] = { id: Number(val) };
      }
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
