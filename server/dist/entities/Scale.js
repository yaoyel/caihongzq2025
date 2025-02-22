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
exports.Scale = void 0;
const typeorm_1 = require("typeorm");
const Element_1 = require("./Element");
let Scale = class Scale {
    id;
    content;
    elementId;
    type;
    direction;
    dimension;
    element;
};
exports.Scale = Scale;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Scale.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'content' }),
    __metadata("design:type", String)
], Scale.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'element_id' }),
    __metadata("design:type", Number)
], Scale.prototype, "elementId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'type' }),
    __metadata("design:type", String)
], Scale.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direction' }),
    __metadata("design:type", String)
], Scale.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dimension' }),
    __metadata("design:type", String)
], Scale.prototype, "dimension", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Element_1.Element),
    __metadata("design:type", Element_1.Element)
], Scale.prototype, "element", void 0);
exports.Scale = Scale = __decorate([
    (0, typeorm_1.Entity)('scales')
], Scale);
