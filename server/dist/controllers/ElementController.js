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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementController = void 0;
const routing_controllers_1 = require("routing-controllers");
const data_source_1 = require("../data-source");
const Element_1 = require("../entity/Element");
let ElementController = class ElementController {
    constructor() {
        this.elementRepository = data_source_1.AppDataSource.getRepository(Element_1.Element);
    }
    async getAll() {
        return this.elementRepository.find();
    }
    async getOne(id) {
        return this.elementRepository.findOne({ where: { id } });
    }
    async create(data) {
        const element = this.elementRepository.create(data);
        return this.elementRepository.save(element);
    }
    async update(id, data) {
        await this.elementRepository.update(id, data);
        return this.elementRepository.findOne({ where: { id } });
    }
    async delete(id) {
        await this.elementRepository.delete(id);
        return { success: true };
    }
};
exports.ElementController = ElementController;
__decorate([
    (0, routing_controllers_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "getAll", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "getOne", null);
__decorate([
    (0, routing_controllers_1.Post)(),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "create", null);
__decorate([
    (0, routing_controllers_1.Put)('/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "update", null);
__decorate([
    (0, routing_controllers_1.Delete)('/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "delete", null);
exports.ElementController = ElementController = __decorate([
    (0, routing_controllers_1.JsonController)('/elements')
], ElementController);
//# sourceMappingURL=ElementController.js.map