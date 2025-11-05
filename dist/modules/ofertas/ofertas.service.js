"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfertasService = void 0;
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
class OfertasService {
    dataSource;
    constructor() {
        this.dataSource = undefined;
    }
    get repo() {
        return this.dataSource.getRepository('ofertas');
    }
    async ensureInitialized() {
        if (!this.dataSource || !this.dataSource.isInitialized) {
            const req = eval('require');
            const out = process.env.BUILD_OUTDIR || 'dist';
            const dsModule = req(path_1.default.join(process.cwd(), out, 'data-source.js'));
            this.dataSource = dsModule.AppDataSource;
            if (!this.dataSource.isInitialized)
                await this.dataSource.initialize();
        }
    }
    async findAll() {
        await this.ensureInitialized();
        // La entidad Oferta se relaciona con lote y consorcio
        return this.repo.find({ relations: ['lote', 'consorcio'] });
    }
    async findOne(id) {
        await this.ensureInitialized();
        return this.repo.findOne({
            where: { id },
            relations: ['lote', 'consorcio'],
        });
    }
    async create(data) {
        await this.ensureInitialized();
        const payload = { ...data };
        // eliminado el manejo de campos no relacionados (procesoId/empresaId)
        if ('loteId' in payload && payload['loteId']) {
            const lote = await this.dataSource
                .getRepository('lotes')
                .findOneBy({ id: payload['loteId'] });
            if (!lote)
                throw new Error('Lote no encontrado');
            payload['lote'] = { id: payload['loteId'] };
            delete payload['loteId'];
        }
        if ('consorcioId' in payload && payload['consorcioId']) {
            const cons = await this.dataSource
                .getRepository('consorcios')
                .findOneBy({ id: payload['consorcioId'] });
            if (!cons)
                throw new Error('Consorcio no encontrado');
            payload['consorcio'] = { id: payload['consorcioId'] };
            delete payload['consorcioId'];
        }
        const entity = this.repo.create(payload);
        return this.repo.save(entity);
    }
    async update(id, data) {
        await this.ensureInitialized();
        const existing = await this.repo.findOneBy({ id });
        if (!existing)
            return null;
        const payload = { ...data };
        // soportar actualización de relaciones mediante campos *_Id
        if ('consorcioId' in payload) {
            const val = payload['consorcioId'];
            if (val == null) {
                existing.consorcio = null;
            }
            else {
                const cons = await this.dataSource
                    .getRepository('consorcios')
                    .findOneBy({ id: Number(val) });
                if (!cons)
                    throw new Error('Consorcio no encontrado');
                payload['consorcio'] = { id: Number(val) };
            }
            delete payload['consorcioId'];
        }
        if ('loteId' in payload) {
            const val = payload['loteId'];
            if (val == null) {
                existing.lote = null;
            }
            else {
                const lote = await this.dataSource
                    .getRepository('lotes')
                    .findOneBy({ id: Number(val) });
                if (!lote)
                    throw new Error('Lote no encontrado');
                payload['lote'] = { id: Number(val) };
            }
            delete payload['loteId'];
        }
        if ('empresaId' in payload) {
            const val = payload['empresaId'];
            if (val == null) {
                existing.empresa = null;
            }
            else {
                const emp = await this.dataSource
                    .getRepository('empresas')
                    .findOneBy({ id: Number(val) });
                if (!emp)
                    throw new Error('Empresa no encontrada');
                payload['empresa'] = { id: Number(val) };
            }
            delete payload['empresaId'];
        }
        Object.assign(existing, payload);
        return this.repo.save(existing);
    }
    async remove(id) {
        await this.ensureInitialized();
        const entity = await this.repo.findOneBy({ id });
        if (!entity)
            return null;
        await this.repo.remove(entity);
        return entity;
    }
}
exports.OfertasService = OfertasService;
