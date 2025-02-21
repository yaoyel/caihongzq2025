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
exports.AssessmentController = void 0;
const routing_controllers_1 = require("routing-controllers");
const Assessment_1 = require("../entity/Assessment");
const Answer_1 = require("../entity/Answer");
const data_source_1 = require("../data-source");
let AssessmentController = class AssessmentController {
    constructor() {
        this.assessmentRepository = data_source_1.AppDataSource.getRepository(Assessment_1.Assessment);
        this.answerRepository = data_source_1.AppDataSource.getRepository(Answer_1.Answer);
    }
    async createAssessment(assessmentData) {
        const assessment = this.assessmentRepository.create(assessmentData);
        return this.assessmentRepository.save(assessment);
    }
    async submitAnswers(assessmentId, answers) {
        const savedAnswers = await Promise.all(answers.map(answer => {
            const newAnswer = this.answerRepository.create({
                ...answer,
                assessmentId
            });
            return this.answerRepository.save(newAnswer);
        }));
        return savedAnswers;
    }
    async getAssessment(id) {
        return this.assessmentRepository.findOne({
            where: { id },
            relations: ['answers']
        });
    }
};
exports.AssessmentController = AssessmentController;
__decorate([
    (0, routing_controllers_1.Post)(),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "createAssessment", null);
__decorate([
    (0, routing_controllers_1.Post)('/:id/answers'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "submitAnswers", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getAssessment", null);
exports.AssessmentController = AssessmentController = __decorate([
    (0, routing_controllers_1.JsonController)('/assessments')
], AssessmentController);
//# sourceMappingURL=AssessmentController.js.map