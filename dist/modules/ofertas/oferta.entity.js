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
exports.Oferta = void 0;
const typeorm_1 = require("typeorm");
const lote_entity_1 = require("../lotes/lote.entity");
const consorcio_entity_1 = require("../consorcios/consorcio.entity");
let Oferta = class Oferta {
    id;
    lote;
    consorcio;
};
exports.Oferta = Oferta;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Oferta.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lote_entity_1.Lote, (l) => l.ofertas, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'lote_id' }),
    __metadata("design:type", lote_entity_1.Lote)
], Oferta.prototype, "lote", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => consorcio_entity_1.Consorcio, (c) => c.ofertas, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'consorcio_id' }),
    __metadata("design:type", consorcio_entity_1.Consorcio)
], Oferta.prototype, "consorcio", void 0);
exports.Oferta = Oferta = __decorate([
    (0, typeorm_1.Entity)({ name: 'ofertas' })
], Oferta);
