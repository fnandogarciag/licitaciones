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
exports.Consorcio = void 0;
const typeorm_1 = require("typeorm");
const oferta_entity_1 = require("../ofertas/oferta.entity");
const consorcio_empresa_entity_1 = require("../consorcio_empresa/consorcio_empresa.entity");
let Consorcio = class Consorcio {
    id;
    nombre;
    ofertas;
    empresas;
};
exports.Consorcio = Consorcio;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Consorcio.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], Consorcio.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => oferta_entity_1.Oferta, (o) => o.consorcio),
    __metadata("design:type", Array)
], Consorcio.prototype, "ofertas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => consorcio_empresa_entity_1.ConsorcioEmpresa, (c) => c.consorcio),
    __metadata("design:type", Array)
], Consorcio.prototype, "empresas", void 0);
exports.Consorcio = Consorcio = __decorate([
    (0, typeorm_1.Entity)({ name: 'consorcios' })
], Consorcio);
