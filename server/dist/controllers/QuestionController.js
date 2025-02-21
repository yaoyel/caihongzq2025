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
const data_source_1 = require("../data-source");
const Question_1 = require("../entity/Question");
const QuestionAnswer_1 = require("../entity/QuestionAnswer");
let QuestionController = class QuestionController {
    constructor() {
        this.questionRepository = data_source_1.AppDataSource.getRepository(Question_1.Question);
        this.answerRepository = data_source_1.AppDataSource.getRepository(QuestionAnswer_1.QuestionAnswer);
    }
    async getAll(ageRange) {
        if (!ageRange) {
            throw new Error('必须指定年龄段');
        }
        return this.questionRepository.find({
            where: { ageRange },
            order: { id: 'ASC' }
        });
    }
    async getUserAnswers(userId, ageRange) {
        const query = this.answerRepository.createQueryBuilder('answer')
            .leftJoinAndSelect('answer.question', 'question')
            .where('answer.userId = :userId', { userId });
        if (ageRange) {
            query.andWhere('question.ageRange = :ageRange', { ageRange });
        }
        return query.orderBy('answer.submittedAt', 'DESC').getMany();
    }
    async getUserAnswerSummary(userId, ageRange) {
        if (!ageRange) {
            throw new Error('必须指定年龄段');
        }
        const [answers, total] = await Promise.all([
            this.answerRepository.createQueryBuilder('answer')
                .leftJoinAndSelect('answer.question', 'question')
                .where('answer.userId = :userId', { userId })
                .andWhere('question.ageRange = :ageRange', { ageRange })
                .orderBy('answer.submittedAt', 'DESC')
                .getMany(),
            this.questionRepository.count({
                where: { ageRange }
            })
        ]);
        return {
            total,
            completed: answers.length,
            answers: answers.map(answer => ({
                questionId: answer.questionId,
                content: answer.content.substring(0, 50) + (answer.content.length > 50 ? '...' : ''),
                submittedAt: answer.submittedAt
            }))
        };
    }
    async submitAnswer(questionId, data) {
        // 检查问题是否存在
        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });
        if (!question) {
            throw new Error('问题不存在');
        }
        // 检查是否已有答案
        let answer = await this.answerRepository.findOne({
            where: {
                questionId,
                userId: data.userId
            }
        });
        if (answer) {
            // 更新现有答案
            answer.content = data.content;
            answer.lastModifiedAt = new Date();
        }
        else {
            // 创建新答案
            answer = this.answerRepository.create({
                questionId,
                ...data
            });
        }
        return this.answerRepository.save(answer);
    }
    async updateAnswer(id, data) {
        const answer = await this.answerRepository.findOne({
            where: { id },
            relations: ['question']
        });
        if (!answer) {
            throw new Error('答案不存在');
        }
        answer.content = data.content;
        answer.lastModifiedAt = new Date();
        return this.answerRepository.save(answer);
    }
};
exports.QuestionController = QuestionController;
__decorate([
    (0, routing_controllers_1.Get)(),
    __param(0, (0, routing_controllers_1.QueryParam)('ageRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "getAll", null);
__decorate([
    (0, routing_controllers_1.Get)('/answers/user/:userId'),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __param(1, (0, routing_controllers_1.QueryParam)('ageRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "getUserAnswers", null);
__decorate([
    (0, routing_controllers_1.Get)('/answers/user/:userId/summary'),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __param(1, (0, routing_controllers_1.QueryParam)('ageRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "getUserAnswerSummary", null);
__decorate([
    (0, routing_controllers_1.Post)('/:id/answers'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "submitAnswer", null);
__decorate([
    (0, routing_controllers_1.Put)('/answers/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], QuestionController.prototype, "updateAnswer", null);
exports.QuestionController = QuestionController = __decorate([
    (0, routing_controllers_1.JsonController)('/questions')
], QuestionController);
//# sourceMappingURL=QuestionController.js.map