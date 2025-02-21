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
exports.QuestionService = void 0;
const typedi_1 = require("typedi");
const typeorm_typedi_extensions_1 = require("typeorm-typedi-extensions");
const typeorm_1 = require("typeorm");
const Question_1 = require("../entities/Question");
const QuestionAnswer_1 = require("../entities/QuestionAnswer");
let QuestionService = class QuestionService {
    questionRepository;
    answerRepository;
    constructor(questionRepository, answerRepository) {
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
    }
    async findByAgeRange(ageRange) {
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
        const [answers, total] = await Promise.all([
            this.getUserAnswers(userId, ageRange),
            this.questionRepository.count({ where: { ageRange } })
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
        let answer = await this.answerRepository.findOne({
            where: { questionId, userId: data.userId }
        });
        if (answer) {
            answer.content = data.content;
            answer.lastModifiedAt = new Date();
        }
        else {
            answer = this.answerRepository.create({
                questionId,
                ...data
            });
        }
        return this.answerRepository.save(answer);
    }
    async updateAnswer(id, content) {
        const answer = await this.answerRepository.findOne({
            where: { id },
            relations: ['question']
        });
        if (!answer) {
            throw new Error('答案不存在');
        }
        answer.content = content;
        answer.lastModifiedAt = new Date();
        return this.answerRepository.save(answer);
    }
};
exports.QuestionService = QuestionService;
exports.QuestionService = QuestionService = __decorate([
    (0, typedi_1.Service)(),
    __param(0, (0, typeorm_typedi_extensions_1.InjectRepository)(Question_1.Question)),
    __param(1, (0, typeorm_typedi_extensions_1.InjectRepository)(QuestionAnswer_1.QuestionAnswer)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository])
], QuestionService);
