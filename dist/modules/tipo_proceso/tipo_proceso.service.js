"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoProcesoService = void 0;
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
class TipoProcesoService {
    dataSource;
    constructor() {
        this.dataSource = undefined;
    }
    get repo() {
        return this.dataSource.getRepository('tipo_proceso');
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
        return this.repo.find();
    }
    async findOne(id) {
        await this.ensureInitialized();
        return this.repo.findOneBy({ id });
    }
    async create(data) {
        await this.ensureInitialized();
        const entity = this.repo.create(data);
        return this.repo.save(entity);
    }
    async update(id, data) {
        await this.ensureInitialized();
        const existing = await this.repo.findOneBy({ id });
        if (!existing)
            return null;
        Object.assign(existing, data);
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
exports.TipoProcesoService = TipoProcesoService;
