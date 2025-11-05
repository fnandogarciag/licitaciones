"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proceso = void 0;
const typeorm_1 = require("typeorm");
const entidad_entity_1 = require("../entidades/entidad.entity");
const estado_proceso_entity_1 = require("../estado_proceso/estado_proceso.entity");
const tipo_proceso_entity_1 = require("../tipo_proceso/tipo_proceso.entity");
const fecha_proceso_entity_1 = require("../fecha_proceso/fecha_proceso.entity");
const lote_entity_1 = require("../lotes/lote.entity");
let Proceso = class Proceso {
    id;
    objeto;
    entidad;
    anticipo;
    mipyme;
    estado;
    tipoProceso;
    codigoLink;
    fechas;
    lotes;
};
exports.Proceso = Proceso;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Proceso.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Proceso.prototype, "objeto", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entidad_entity_1.Entidad, (entidad) => entidad.procesos, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'entidad_id' }),
    __metadata("design:type", entidad_entity_1.Entidad)
], Proceso.prototype, "entidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', nullable: true }),
    __metadata("design:type", Number)
], Proceso.prototype, "anticipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], Proceso.prototype, "mipyme", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => estado_proceso_entity_1.EstadoProceso, (e) => e.procesos, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'estado_id' }),
    __metadata("design:type", estado_proceso_entity_1.EstadoProceso)
], Proceso.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tipo_proceso_entity_1.TipoProceso, (t) => t.procesos, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'tipo_proceso_id' }),
    __metadata("design:type", tipo_proceso_entity_1.TipoProceso)
], Proceso.prototype, "tipoProceso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'codigo_link', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Proceso.prototype, "codigoLink", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => fecha_proceso_entity_1.FechaProceso, (f) => f.proceso),
    __metadata("design:type", Array)
], Proceso.prototype, "fechas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lote_entity_1.Lote, (l) => l.proceso),
    __metadata("design:type", Array)
], Proceso.prototype, "lotes", void 0);
exports.Proceso = Proceso = __decorate([
    (0, typeorm_1.Entity)({ name: 'procesos' })
], Proceso);
