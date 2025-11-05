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
exports.ConsorcioEmpresa = void 0;
const typeorm_1 = require("typeorm");
const consorcio_entity_1 = require("../consorcios/consorcio.entity");
const empresa_entity_1 = require("../empresas/empresa.entity");
let ConsorcioEmpresa = class ConsorcioEmpresa {
    id;
    consorcio;
    empresa;
};
exports.ConsorcioEmpresa = ConsorcioEmpresa;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], ConsorcioEmpresa.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => consorcio_entity_1.Consorcio, (c) => c.empresas, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'consorcio_id' }),
    __metadata("design:type", consorcio_entity_1.Consorcio)
], ConsorcioEmpresa.prototype, "consorcio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empresa_entity_1.Empresa, (e) => e.consorcios, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'empresa_id' }),
    __metadata("design:type", empresa_entity_1.Empresa)
], ConsorcioEmpresa.prototype, "empresa", void 0);
exports.ConsorcioEmpresa = ConsorcioEmpresa = __decorate([
    (0, typeorm_1.Entity)({ name: 'consorcio_empresa' })
], ConsorcioEmpresa);
