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
exports.ScaleController = void 0;
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const typedi_1 = require("typedi");
const scale_service_1 = require("../services/scale.service");
let ScaleController = class ScaleController {
    scaleService;
    constructor(scaleService) {
        this.scaleService = scaleService;
    }
    async getAll(type, direction) {
        return await this.scaleService.findAll(type, direction);
    }
    async getOne(id) {
        return await this.scaleService.findOne(id);
    }
    async submitAnswer(scaleId, data) {
        return await this.scaleService.submitAnswer(scaleId, data);
    }
    async getUserAnswers(userId) {
        return await this.scaleService.getUserAnswers(userId);
    }
};
exports.ScaleController = ScaleController;
__decorate([
    (0, routing_controllers_1.Get)(),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取量表列表' }),
    __param(0, (0, routing_controllers_1.QueryParam)('type')),
    __param(1, (0, routing_controllers_1.QueryParam)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "getAll", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取量表详情' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "getOne", null);
__decorate([
    (0, routing_controllers_1.Post)('/:id/answers'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '提交量表答案' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "submitAnswer", null);
__decorate([
    (0, routing_controllers_1.Get)('/answers/user/:userId'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取用户的量表答案' }),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "getUserAnswers", null);
exports.ScaleController = ScaleController = __decorate([
    (0, routing_controllers_1.JsonController)('/scales'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [scale_service_1.ScaleService])
], ScaleController);
