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
exports.Lote = void 0;
const typeorm_1 = require("typeorm");
const proceso_entity_1 = require("../procesos/proceso.entity");
const oferta_entity_1 = require("../ofertas/oferta.entity");
const decimalToNumber = {
    to: (value) => value === null || value === undefined ? null : value,
    from: (value) => value === null || value === undefined ? null : parseFloat(value),
};
let Lote = class Lote {
    id;
    proceso;
    valor;
    poliza;
    poliza_real;
    ofertas;
};
exports.Lote = Lote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Lote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => proceso_entity_1.Proceso, (p) => p.lotes, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'proceso_id' }),
    __metadata("design:type", proceso_entity_1.Proceso)
], Lote.prototype, "proceso", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 2,
        nullable: true,
        transformer: decimalToNumber,
    }),
    __metadata("design:type", Object)
], Lote.prototype, "valor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 2,
        nullable: true,
        transformer: decimalToNumber,
    }),
    __metadata("design:type", Object)
], Lote.prototype, "poliza", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], Lote.prototype, "poliza_real", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => oferta_entity_1.Oferta, (o) => o.lote),
    __metadata("design:type", Array)
], Lote.prototype, "ofertas", void 0);
exports.Lote = Lote = __decorate([
    (0, typeorm_1.Entity)({ name: 'lotes' })
], Lote);
