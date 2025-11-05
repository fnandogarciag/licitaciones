"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcesosService = void 0;
const proceso_entity_1 = require("./proceso.entity");
const data_source_1 = require("../../config/data-source");
const entidad_entity_1 = require("../entidades/entidad.entity");
const estado_proceso_entity_1 = require("../estado_proceso/estado_proceso.entity");
const tipo_proceso_entity_1 = require("../tipo_proceso/tipo_proceso.entity");
class ProcesosService {
    dataSource;
    constructor() {
        this.dataSource = data_source_1.AppDataSource;
    }
    get repo() {
        return this.dataSource.getRepository(proceso_entity_1.Proceso);
    }
    async ensureInitialized() {
        if (!this.dataSource.isInitialized) {
            try {
                await this.dataSource.initialize();
            }
            catch (err) {
                console.error('Error inicializando la base de datos en ProcesosService:', err);
                throw err;
            }
        }
    }
    async findAll() {
        await this.ensureInitialized();
        const repo = this.repo;
        return repo.find({
            // Usar los nombres de propiedades definidos en Proceso (entidad, estado, tipoProceso)
            // Incluir relaciones anidadas para que el frontend reciba lotes.ofertas y oferta.consorcio
            relations: [
                'entidad',
                'estado',
                'tipoProceso',
                'fechas',
                'fechas.tipoFechaProceso',
                'lotes',
                'lotes.ofertas',
                'lotes.ofertas.consorcio',
            ],
        });
    }
    async findOne(id) {
        await this.ensureInitialized();
        const repo = this.repo;
        return repo.findOne({
            where: { id },
            relations: [
                'entidad',
                'estado',
                'tipoProceso',
                'fechas',
                'fechas.tipoFechaProceso',
                'lotes',
                'lotes.ofertas',
                'lotes.ofertas.consorcio',
            ],
        });
    }
    async create(data) {
        await this.ensureInitialized();
        const payload = { ...data };
        if ('entidadId' in payload && payload['entidadId']) {
            const entidadRepo = this.dataSource.getRepository(entidad_entity_1.Entidad);
            const entidad = await entidadRepo.findOneBy({
                id: payload['entidadId'],
            });
            if (!entidad)
                throw new Error('Entidad no encontrada');
            payload['entidad'] = { id: payload['entidadId'] };
            delete payload['entidadId'];
        }
        if ('estadoId' in payload && payload['estadoId']) {
            const estadoRepo = this.dataSource.getRepository(estado_proceso_entity_1.EstadoProceso);
            const estado = await estadoRepo.findOneBy({
                id: payload['estadoId'],
            });
            if (!estado)
                throw new Error('Estado no encontrado');
            payload['estado'] = { id: payload['estadoId'] };
            delete payload['estadoId'];
        }
        if ('tipoProcesoId' in payload && payload['tipoProcesoId']) {
            const tipoRepo = this.dataSource.getRepository(tipo_proceso_entity_1.TipoProceso);
            const tipo = await tipoRepo.findOneBy({
                id: payload['tipoProcesoId'],
            });
            if (!tipo)
                throw new Error('Tipo de proceso no encontrado');
            payload['tipoProceso'] = { id: payload['tipoProcesoId'] };
            delete payload['tipoProcesoId'];
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
        if ('entidadId' in payload) {
            const val = payload['entidadId'];
            if (val == null) {
                existing.entidad = null;
            }
            else {
                const entidadRepo = this.dataSource.getRepository(entidad_entity_1.Entidad);
                const entidad = await entidadRepo.findOneBy({ id: Number(val) });
                if (!entidad)
                    throw new Error('Entidad no encontrada');
                existing.entidad = { id: Number(val) };
            }
            delete payload.entidadId;
        }
        if ('estadoId' in payload) {
            const val = payload['estadoId'];
            if (val == null) {
                existing.estado = null;
            }
            else {
                const estadoRepo = this.dataSource.getRepository(estado_proceso_entity_1.EstadoProceso);
                const estado = await estadoRepo.findOneBy({ id: Number(val) });
                if (!estado)
                    throw new Error('Estado no encontrado');
                existing.estado = { id: Number(val) };
            }
            delete payload.estadoId;
        }
        if ('tipoProcesoId' in payload) {
            const val = payload['tipoProcesoId'];
            if (val == null) {
                existing.tipoProceso = null;
            }
            else {
                const tipoRepo = this.dataSource.getRepository(tipo_proceso_entity_1.TipoProceso);
                const tipo = await tipoRepo.findOneBy({ id: Number(val) });
                if (!tipo)
                    throw new Error('Tipo de proceso no encontrado');
                existing.tipoProceso = { id: Number(val) };
            }
            delete payload.tipoProcesoId;
        }
        Object.assign(existing, payload);
        return this.repo.save(existing);
    }
}
exports.ProcesosService = ProcesosService;
