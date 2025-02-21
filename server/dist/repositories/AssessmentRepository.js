"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentRepository = void 0;
const Question_1 = require("../entity/Question");
const Answer_1 = require("../entity/Answer");
const Assessment_1 = require("../entity/Assessment");
const User_1 = require("../entity/User");
const CustomError_1 = require("../utils/CustomError");
const data_source_1 = require("../data-source");
class AssessmentRepository {
    constructor() {
        this.questionRepo = data_source_1.AppDataSource.getRepository(Question_1.Question);
        this.answerRepo = data_source_1.AppDataSource.getRepository(Answer_1.Answer);
        this.assessmentRepo = data_source_1.AppDataSource.getRepository(Assessment_1.Assessment);
        this.userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
    }
    async findScaleQuestions() {
        return this.questionRepo.find({
            where: {
                type: 'scale',
                isActive: true
            },
            order: {
                id: 'ASC'
            }
        });
    }
    async findQAQuestions() {
        return this.questionRepo.find({
            where: {
                type: 'qa',
                isActive: true
            },
            order: {
                id: 'ASC'
            }
        });
    }
    async findUserById(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new CustomError_1.CustomError('用户不存在', 404);
        }
        return user;
    }
    async saveScaleAnswers(user, answers) {
        const answerEntities = answers.map(ans => {
            const answer = new Answer_1.Answer();
            answer.user = user;
            answer.questionId = ans.questionId;
            answer.value = ans.value;
            answer.dimensions = ans.dimensions;
            return answer;
        });
        await this.answerRepo.save(answerEntities);
    }
    async saveQAAnswers(user, answers) {
        const answerEntities = answers.map(ans => {
            const answer = new Answer_1.Answer();
            answer.user = user;
            answer.questionId = ans.questionId;
            answer.textAnswer = ans.content;
            return answer;
        });
        await this.answerRepo.save(answerEntities);
    }
    async createAssessment(assessment) {
        const newAssessment = this.assessmentRepo.create(assessment);
        return this.assessmentRepo.save(newAssessment);
    }
}
exports.AssessmentRepository = AssessmentRepository;
//# sourceMappingURL=AssessmentRepository.js.map