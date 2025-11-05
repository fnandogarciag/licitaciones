"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsorcioEmpresaService = void 0;
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
class ConsorcioEmpresaService {
    dataSource;
    constructor() {
        this.dataSource = undefined;
    }
    get repo() {
        return this.dataSource.getRepository('consorcio_empresa');
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
        return this.repo.find({ relations: ['consorcio', 'empresa'] });
    }
    async findOne(id) {
        await this.ensureInitialized();
        return this.repo.findOne({
            where: { id },
            relations: ['consorcio', 'empresa'],
        });
    }
    async create(data) {
        await this.ensureInitialized();
        const payload = { ...data };
        if ('consorcioId' in payload && payload['consorcioId']) {
            const cons = await this.dataSource
                .getRepository('consorcios')
                .findOneBy({ id: payload['consorcioId'] });
            if (!cons)
                throw new Error('Consorcio no encontrado');
            payload['consorcio'] = { id: payload['consorcioId'] };
            delete payload['consorcioId'];
        }
        if ('empresaId' in payload && payload['empresaId']) {
            const emp = await this.dataSource
                .getRepository('empresas')
                .findOneBy({ id: payload['empresaId'] });
            if (!emp)
                throw new Error('Empresa no encontrada');
            payload['empresa'] = { id: payload['empresaId'] };
            delete payload['empresaId'];
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
        if ('consorcioId' in payload && payload['consorcioId']) {
            const cons = await this.dataSource
                .getRepository('consorcios')
                .findOneBy({ id: payload['consorcioId'] });
            if (!cons)
                throw new Error('Consorcio no encontrado');
            payload['consorcio'] = { id: payload['consorcioId'] };
            delete payload['consorcioId'];
        }
        if ('empresaId' in payload && payload['empresaId']) {
            const emp = await this.dataSource
                .getRepository('empresas')
                .findOneBy({ id: payload['empresaId'] });
            if (!emp)
                throw new Error('Empresa no encontrada');
            payload['empresa'] = { id: payload['empresaId'] };
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
exports.ConsorcioEmpresaService = ConsorcioEmpresaService;
