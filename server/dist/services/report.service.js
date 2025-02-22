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
exports.ReportService = void 0;
const typedi_1 = require("typedi");
const typeorm_typedi_extensions_1 = require("typeorm-typedi-extensions");
const scale_answer_repository_1 = require("../repositories/scale-answer.repository");
const logger_1 = require("../config/logger");
let ReportService = class ReportService {
    scaleAnswerRepository;
    constructor(scaleAnswerRepository) {
        this.scaleAnswerRepository = scaleAnswerRepository;
    }
    calculateScore(talentPositive, talentNegative, likePositive, likeNegative) {
        const normalizeScore = (score) => {
            if (!score)
                return 0;
            return ((4 - score) / 3) * 100;
        };
        const talentScore = (normalizeScore(talentPositive) + normalizeScore(talentNegative)) / 2;
        const interestScore = (normalizeScore(likePositive) + normalizeScore(likeNegative)) / 2;
        return (talentScore * 0.6 + interestScore * 0.4);
    }
    async getTalentAnalysis(userId) {
        try {
            const answers = await this.scaleAnswerRepository.findAllByUserIdWithScale(userId);
            const dimensionMap = new Map();
            answers.forEach(answer => {
                const dimension = answer.scale.dimension;
                const current = dimensionMap.get(dimension) || {};
                if (answer.scale.type === 'talent') {
                    if (answer.scale.direction === 'positive') {
                        current.talentPositive = answer.score;
                    }
                    else {
                        current.talentNegative = answer.score;
                    }
                }
                else {
                    if (answer.scale.direction === 'positive') {
                        current.likePositive = answer.score;
                    }
                    else {
                        current.likeNegative = answer.score;
                    }
                }
                dimensionMap.set(dimension, current);
            });
            const analysis = Array.from(dimensionMap.entries())
                .map(([dimension, scores]) => ({
                dimension,
                hasTalent: Boolean(scores.talentPositive &&
                    scores.talentNegative &&
                    scores.talentPositive <= 2 &&
                    scores.talentNegative >= 3),
                hasInterest: Boolean(scores.likePositive &&
                    scores.likeNegative &&
                    scores.likePositive <= 2 &&
                    scores.likeNegative >= 3),
                score: this.calculateScore(scores.talentPositive, scores.talentNegative, scores.likePositive, scores.likeNegative)
            }));
            logger_1.logger.info('Talent analysis completed', { userId });
            return {
                bothTalentAndInterest: analysis.filter(item => item.hasTalent && item.hasInterest),
                neitherTalentNorInterest: analysis.filter(item => !item.hasTalent && !item.hasInterest),
                onlyInterest: analysis.filter(item => !item.hasTalent && item.hasInterest),
                onlyTalent: analysis.filter(item => item.hasTalent && !item.hasInterest),
                rawAnalysis: analysis
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get talent analysis', {
                userId,
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack
                } : error
            });
            throw error;
        }
    }
    async getReport(userId) {
        try {
            const latestAnswer = await this.scaleAnswerRepository.findLatestByUserId(userId);
            if (!latestAnswer) {
                throw new Error('No answers found');
            }
            const talentAnalysis = await this.getTalentAnalysis(userId);
            const reportContent = {
                basicInfo: {
                    userId: Number(userId),
                    submittedAt: latestAnswer.submittedAt
                },
                talentAnalysis: {
                    categorizedResults: {
                        bothTalentAndInterest: talentAnalysis.bothTalentAndInterest,
                        neitherTalentNorInterest: talentAnalysis.neitherTalentNorInterest,
                        onlyInterest: talentAnalysis.onlyInterest,
                        onlyTalent: talentAnalysis.onlyTalent
                    },
                    radarData: talentAnalysis.rawAnalysis.map(item => ({
                        dimension: item.dimension,
                        score: item.score
                    }))
                }
            };
            logger_1.logger.info('Report generated successfully', { userId });
            return reportContent;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate report', {
                userId,
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack
                } : error
            });
            throw error;
        }
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, typedi_1.Service)(),
    __param(0, (0, typeorm_typedi_extensions_1.InjectRepository)(scale_answer_repository_1.ScaleAnswerRepository)),
    __metadata("design:paramtypes", [scale_answer_repository_1.ScaleAnswerRepository])
], ReportService);
