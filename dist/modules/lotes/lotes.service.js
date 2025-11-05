"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotesService = void 0;
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
class LotesService {
    dataSource;
    constructor() {
        this.dataSource = undefined;
    }
    get repo() {
        return this.dataSource.getRepository('lotes');
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
        return this.repo.find({
            relations: ['proceso', 'ofertas', 'ofertas.consorcio'],
        });
    }
    async findOne(id) {
        await this.ensureInitialized();
        return this.repo.findOne({
            where: { id },
            relations: ['proceso', 'ofertas', 'ofertas.consorcio'],
        });
    }
    async create(data) {
        await this.ensureInitialized();
        const payload = { ...data };
        if ('procesoId' in payload && payload['procesoId']) {
            const proc = await this.dataSource
                .getRepository('procesos')
                .findOneBy({ id: payload['procesoId'] });
            if (!proc)
                throw new Error('Proceso no encontrado');
            payload['proceso'] = { id: payload['procesoId'] };
            delete payload['procesoId'];
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
        if ('procesoId' in payload) {
            const val = payload['procesoId'];
            if (val == null) {
                existing.proceso = null;
                delete payload.procesoId;
            }
            else {
                const proc = await this.dataSource
                    .getRepository('procesos')
                    .findOneBy({ id: Number(val) });
                if (!proc)
                    throw new Error('Proceso no encontrado');
                payload.proceso = { id: Number(val) };
                delete payload.procesoId;
            }
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
    /**
     * Remove lote and related ofertas inside a transaction.
     */
    async removeCascade(id) {
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
            if (!target)
                return null;
            await repo.remove(target);
            return target;
        });
    }
}
exports.LotesService = LotesService;
