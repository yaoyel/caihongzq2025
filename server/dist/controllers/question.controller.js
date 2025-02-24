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
exports.QuestionController = void 0;
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const typedi_1 = require("typedi");
const question_service_1 = require("../services/question.service");
let QuestionController = class QuestionController {
    questionService;
    constructor(questionService) {
        this.questionService = questionService;
    }
    async getAll(ageRange) {
        if (!ageRange) {
            throw new Error('必须指定年龄段');
        }
        return await this.questionService.findByAgeRange(ageRange);
    }
    async getUserAnswers(userId, ageRange) {
        return await this.questionService.getUserAnswers(userId, ageRange);
    }
    async getUserAnswerSummary(userId, ageRange) {
        return await this.questionService.getUserAnswerSummary(userId, ageRange);
    }
    async submitAnswer(questionId, data) {
        return await this.questionService.submitAnswer(questionId, data);
    }
    async updateAnswer(id, data) {
        return await this.questionService.updateAnswer(id, data.content);
    }
};
exports.QuestionController = QuestionController;
__decorate([
    (0, routing_controllers_1.Get)(),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取问题列表' }),
    __param(0, (0, routing_controllers_1.QueryParam)('ageRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "getAll", null);
__decorate([
    (0, routing_controllers_1.Get)('/answers/user/:userId'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取用户的答案' }),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __param(1, (0, routing_controllers_1.QueryParam)('ageRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "getUserAnswers", null);
__decorate([
    (0, routing_controllers_1.Get)('/answers/user/:userId/summary'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取用户答案摘要' }),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __param(1, (0, routing_controllers_1.QueryParam)('ageRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "getUserAnswerSummary", null);
__decorate([
    (0, routing_controllers_1.Post)('/:id/answers'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '提交答案' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "submitAnswer", null);
__decorate([
    (0, routing_controllers_1.Put)('/answers/:id'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '更新答案' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "updateAnswer", null);
exports.QuestionController = QuestionController = __decorate([
    (0, routing_controllers_1.JsonController)('/questions'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [question_service_1.QuestionService])
], QuestionController);
