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
exports.Element = void 0;
const typeorm_1 = require("typeorm");
const DoubleEdgedInfo_1 = require("./DoubleEdgedInfo");
let Element = class Element {
    id;
    name;
    type;
    status;
    dimension;
    correspondingElementId;
    correspondingElement;
    doubleEdgedId;
    doubleEdgedInfo;
};
exports.Element = Element;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    (0, typeorm_1.Generated)('increment'),
    __metadata("design:type", Number)
], Element.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name' }),
    __metadata("design:type", String)
], Element.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'type' }),
    __metadata("design:type", String)
], Element.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status' }),
    __metadata("design:type", String)
], Element.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dimension' }),
    __metadata("design:type", String)
], Element.prototype, "dimension", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'corresponding_element_id' }),
    __metadata("design:type", Number)
], Element.prototype, "correspondingElementId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Element),
    (0, typeorm_1.JoinColumn)({ name: 'corresponding_element_id' }),
    __metadata("design:type", Element)
], Element.prototype, "correspondingElement", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'double_edged_id', nullable: true }),
    __metadata("design:type", Number)
], Element.prototype, "doubleEdgedId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => DoubleEdgedInfo_1.DoubleEdgedInfo),
    (0, typeorm_1.JoinColumn)({ name: 'double_edged_id' }),
    __metadata("design:type", DoubleEdgedInfo_1.DoubleEdgedInfo)
], Element.prototype, "doubleEdgedInfo", void 0);
exports.Element = Element = __decorate([
    (0, typeorm_1.Entity)('elements')
], Element);
