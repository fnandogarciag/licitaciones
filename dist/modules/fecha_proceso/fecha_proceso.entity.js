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
exports.FechaProceso = void 0;
const typeorm_1 = require("typeorm");
const proceso_entity_1 = require("../procesos/proceso.entity");
const tipo_fecha_proceso_entity_1 = require("../tipo_fecha_proceso/tipo_fecha_proceso.entity");
let FechaProceso = class FechaProceso {
    id;
    proceso;
    tipoFechaProceso;
    fecha;
    importante;
};
exports.FechaProceso = FechaProceso;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], FechaProceso.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => proceso_entity_1.Proceso, (p) => p.fechas, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'proceso_id' }),
    __metadata("design:type", proceso_entity_1.Proceso)
], FechaProceso.prototype, "proceso", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tipo_fecha_proceso_entity_1.TipoFechaProceso, (t) => t.fechas, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'tipo_fecha_proceso_id' }),
    __metadata("design:type", tipo_fecha_proceso_entity_1.TipoFechaProceso)
], FechaProceso.prototype, "tipoFechaProceso", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], FechaProceso.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'importante', default: false }),
    __metadata("design:type", Boolean)
], FechaProceso.prototype, "importante", void 0);
exports.FechaProceso = FechaProceso = __decorate([
    (0, typeorm_1.Entity)({ name: 'fecha_proceso' })
], FechaProceso);
