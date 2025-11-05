"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FechaProcesoService = void 0;
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
class FechaProcesoService {
    dataSource;
    constructor() {
        this.dataSource = undefined;
    }
    get repo() {
        return this.dataSource.getRepository('fecha_proceso');
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
            relations: ['proceso', 'tipoFechaProceso'],
        });
    }
    async findOne(id) {
        await this.ensureInitialized();
        return this.repo.findOne({
            where: { id },
            relations: ['proceso', 'tipoFechaProceso'],
        });
    }
    async create(data) {
        await this.ensureInitialized();
        const payload = {
            ...data,
        };
        const p = payload;
        if ('procesoId' in p && p['procesoId']) {
            const proc = await this.dataSource
                .getRepository('procesos')
                .findOneBy({ id: p['procesoId'] });
            if (!proc)
                throw new Error('Proceso no encontrado');
            p['proceso'] = { id: p['procesoId'] };
            delete p['procesoId'];
        }
        if ('tipoFechaProcesoId' in p && p['tipoFechaProcesoId']) {
            const tf = await this.dataSource
                .getRepository('tipo_fecha_proceso')
                .findOneBy({ id: p['tipoFechaProcesoId'] });
            if (!tf)
                throw new Error('Tipo de fecha no encontrado');
            p['tipoFechaProceso'] = { id: p['tipoFechaProcesoId'] };
            delete p['tipoFechaProcesoId'];
        }
        // If the payload requests this fecha as `importante`, perform creation inside
        // a transaction and ensure other fechas for the same proceso are unset so
        // the unique partial index is not violated.
        if (p.importante) {
            return this.dataSource.transaction(async (manager) => {
                const repo = manager.getRepository('fecha_proceso');
                // determine proceso id from payload if possible
                const procesoIdFromPayload = p.proceso?.id ?? p.procesoId ?? null;
                // Insert the entity with importante=false first to avoid unique constraint
                const safePayload = {
                    ...p,
                    importante: false,
                };
                const toCreate = repo.create(safePayload);
                const saved = await repo.save(toCreate);
                // Now unset other importantes and set this one to importante=true atomically
                const procesoId = procesoIdFromPayload ?? saved.proceso?.id ?? null;
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
            }
            else {
                // validate existence
                const repoProc = this.dataSource.getRepository('procesos');
                const proc = await repoProc.findOneBy({ id: Number(val) });
                if (!proc)
                    throw new Error('Proceso no encontrado');
                payload['proceso'] = { id: Number(val) };
            }
            delete payload['procesoId'];
        }
        if ('tipoFechaProcesoId' in payload) {
            const val = payload['tipoFechaProcesoId'];
            if (val == null) {
                existing.tipoFechaProceso = null;
            }
            else {
                const repoTf = this.dataSource.getRepository('tipo_fecha_proceso');
                const tf = await repoTf.findOneBy({ id: Number(val) });
                if (!tf)
                    throw new Error('Tipo de fecha no encontrado');
                payload['tipoFechaProceso'] = { id: Number(val) };
            }
            delete payload['tipoFechaProcesoId'];
        }
        Object.assign(existing, payload);
        return this.repo.save(existing);
    }
    async remove(id) {
        await this.ensureInitialized();
        const e = await this.repo.findOneBy({ id });
        if (!e)
            return null;
        await this.repo.remove(e);
        return e;
    }
    /**
     * Marca una fecha como importante.
     * Si `setTo` es true, desmarca las demás del mismo proceso en una transacción.
     */
    async markImportant(id, setTo) {
        await this.ensureInitialized();
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository('fecha_proceso');
            const target = await repo.findOne({
                where: { id },
                relations: ['proceso'],
            });
            if (!target)
                return null;
            const procesoId = target.proceso?.id ?? target.procesoId ?? null;
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
            }
            else {
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
exports.FechaProcesoService = FechaProcesoService;
