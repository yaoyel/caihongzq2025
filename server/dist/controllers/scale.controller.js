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
const data_source_1 = require("../data-source");
const ScaleAnswer_1 = require("../entities/ScaleAnswer");
let ScaleController = class ScaleController {
    scaleService;
    constructor(scaleService) {
        this.scaleService = scaleService;
    }
    async getByElements(elementIds) {
        if (!elementIds || elementIds.trim() === '') {
            return [];
        }
        try {
            // 移除所有空格，然后按逗号分割
            const elementIdArray = elementIds
                .trim()
                .split(',')
                .map(Number)
                .filter(id => !isNaN(id) && id > 0);
            if (elementIdArray.length === 0) {
                return [];
            }
            return await this.scaleService.findByElements(elementIdArray);
        }
        catch (error) {
            console.error('Error in getByElements:', error);
            return [];
        }
    }
    async getAll(type, direction) {
        return await this.scaleService.findAll(type, direction);
    }
    async getOne(id) {
        return await this.scaleService.findOne(id);
    }
    async submitAnswer(scaleId, data) {
        try {
            // 1. 检查是否存在答案
            const existingAnswer = await data_source_1.AppDataSource
                .getRepository(ScaleAnswer_1.ScaleAnswer)
                .findOne({
                where: {
                    scaleId: scaleId,
                    userId: data.userId
                }
            });
            if (existingAnswer) {
                // 2. 如果存在则更新
                await data_source_1.AppDataSource
                    .getRepository(ScaleAnswer_1.ScaleAnswer)
                    .update({ id: existingAnswer.id }, { score: data.score });
                return {
                    success: true,
                    message: '答案已更新',
                    data: {
                        ...existingAnswer,
                        score: data.score
                    }
                };
            }
            else {
                // 3. 如果不存在则创建新答案
                const newAnswer = await data_source_1.AppDataSource
                    .getRepository(ScaleAnswer_1.ScaleAnswer)
                    .save({
                    scaleId: scaleId,
                    userId: data.userId,
                    score: data.score
                });
                return {
                    success: true,
                    message: '答案已保存',
                    data: newAnswer
                };
            }
        }
        catch (error) {
            console.error('Error submitting answer:', error);
            return {
                success: false,
                message: '保存答案失败',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async getUserAnswers(userId) {
        return await this.scaleService.getUserAnswers(userId);
    }
    async getUserAnswersSummary(userId) {
        return await this.scaleService.getUserAnswersSummary(userId);
    }
};
exports.ScaleController = ScaleController;
__decorate([
    (0, routing_controllers_1.Get)('/by-elements'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '通过元素ID列表获取量表' }),
    __param(0, (0, routing_controllers_1.QueryParam)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "getByElements", null);
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
__decorate([
    (0, routing_controllers_1.Get)('/answers/user/:userId/summary'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取用户量表答题汇总' }),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "getUserAnswersSummary", null);
exports.ScaleController = ScaleController = __decorate([
    (0, routing_controllers_1.JsonController)('/scales'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [scale_service_1.ScaleService])
], ScaleController);
