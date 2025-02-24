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
exports.QuestionService = void 0;
const typedi_1 = require("typedi");
const Question_1 = require("../entities/Question");
const QuestionAnswer_1 = require("../entities/QuestionAnswer");
const data_source_1 = require("../data-source");
let QuestionService = class QuestionService {
    questionRepository;
    answerRepository;
    constructor() {
        this.questionRepository = data_source_1.AppDataSource.getRepository(Question_1.Question);
        this.answerRepository = data_source_1.AppDataSource.getRepository(QuestionAnswer_1.QuestionAnswer);
    }
    async findByAgeRange(ageRange) {
        return this.questionRepository.find({
            where: { ageRange: ageRange },
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
                content: answer.content,
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
    __metadata("design:paramtypes", [])
], QuestionService);
