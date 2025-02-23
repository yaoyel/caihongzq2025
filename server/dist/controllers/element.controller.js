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
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const typedi_1 = require("typedi");
const element_service_1 = require("../services/element.service");
let ElementController = class ElementController {
    elementService;
    constructor(elementService) {
        this.elementService = elementService;
    }
    async getAll() {
        return await this.elementService.findAll();
    }
    async getOne(id) {
        return await this.elementService.findOne(id);
    }
    async create(data) {
        return await this.elementService.create(data);
    }
    async update(id, data) {
        return await this.elementService.update(id, data);
    }
    async delete(id) {
        await this.elementService.delete(id);
        return { success: true };
    }
};
exports.ElementController = ElementController;
__decorate([
    (0, routing_controllers_1.Get)(),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取所有元素' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "getAll", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取单个元素' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "getOne", null);
__decorate([
    (0, routing_controllers_1.Post)(),
    (0, routing_controllers_1.Authorized)(),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '创建元素' }),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "create", null);
__decorate([
    (0, routing_controllers_1.Put)('/:id'),
    (0, routing_controllers_1.Authorized)(),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '更新元素' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "update", null);
__decorate([
    (0, routing_controllers_1.Delete)('/:id'),
    (0, routing_controllers_1.Authorized)(),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '删除元素' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ElementController.prototype, "delete", null);
exports.ElementController = ElementController = __decorate([
    (0, routing_controllers_1.JsonController)('/elements'),
    (0, routing_controllers_1.Authorized)(),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [element_service_1.ElementService])
], ElementController);
