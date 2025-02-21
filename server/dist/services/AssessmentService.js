"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentService = void 0;
const AssessmentRepository_1 = require("../repositories/AssessmentRepository");
class AssessmentService {
    constructor() {
        this.assessmentRepo = new AssessmentRepository_1.AssessmentRepository();
    }
    async getScaleQuestions() {
        return this.assessmentRepo.findScaleQuestions();
    }
    async getQAQuestions() {
        return this.assessmentRepo.findQAQuestions();
    }
    async submitScaleAnswers(data) {
        console.log('服务层开始处理量表答案提交');
        try {
            console.log('查找用户:', data.userId);
            const user = await this.assessmentRepo.findUserById(data.userId);
            console.log('找到用户:', user);
            console.log('保存答案');
            await this.assessmentRepo.saveScaleAnswers(user, data.answers);
            console.log('答案保存成功');
            // 生成评估报告
            console.log('开始生成评估报告');
            const assessmentResult = await this.generateAssessmentReport(user.id);
            console.log('评估报告生成完成');
            console.log('保存评估结果');
            await this.assessmentRepo.createAssessment({
                user,
                ...assessmentResult
            });
            console.log('评估结果保存成功');
        }
        catch (error) {
            console.error('服务层处理失败:', error);
            throw error;
        }
    }
    async submitQAAnswers(data) {
        const user = await this.assessmentRepo.findUserById(data.userId);
        await this.assessmentRepo.saveQAAnswers(user, data.answers);
    }
    async generateAssessmentReport(userId) {
        // TODO: 实现评估报告生成逻辑
        return {
            dimensions: [],
            talents: [],
            interests: []
        };
    }
}
exports.AssessmentService = AssessmentService;
//# sourceMappingURL=AssessmentService.js.map