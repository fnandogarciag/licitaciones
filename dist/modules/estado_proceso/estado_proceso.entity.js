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
exports.EstadoProceso = void 0;
const typeorm_1 = require("typeorm");
const proceso_entity_1 = require("../procesos/proceso.entity");
let EstadoProceso = class EstadoProceso {
    id;
    nombre;
    procesos;
};
exports.EstadoProceso = EstadoProceso;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], EstadoProceso.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], EstadoProceso.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => proceso_entity_1.Proceso, (p) => p.estado),
    __metadata("design:type", Array)
], EstadoProceso.prototype, "procesos", void 0);
exports.EstadoProceso = EstadoProceso = __decorate([
    (0, typeorm_1.Entity)({ name: 'estado_proceso' })
], EstadoProceso);
