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
exports.ReportService = void 0;
const typedi_1 = require("typedi");
const ScaleAnswer_1 = require("../entities/ScaleAnswer");
const data_source_1 = require("../data-source");
const report_repository_1 = require("../repositories/report.repository");
let ReportService = class ReportService {
    reportRepository;
    scaleAnswerRepository;
    constructor(reportRepository) {
        this.reportRepository = reportRepository;
        this.scaleAnswerRepository = data_source_1.AppDataSource.getRepository(ScaleAnswer_1.ScaleAnswer);
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
    async getElementAnalysis(userId) {
        return await this.reportRepository.getElementAnalysis(userId);
    }
    async getTalentAnalysis(userId) {
        try {
            const answers = await this.scaleAnswerRepository.find({
                where: { userId },
                relations: ['scale', 'scale.element']
            });
            const dimensionMap = new Map();
            answers.forEach(answer => {
                const dimension = answer.scale.dimension;
                const current = dimensionMap.get(dimension) || {};
                if (answer.scale.type === 'talent') {
                    if (answer.scale.direction === 'positive') {
                        current.talentPositive = answer.score;
                        current.talentPositiveElement = {
                            id: answer.scale.element.id,
                            name: answer.scale.element.name,
                            score: answer.score
                        };
                    }
                    else {
                        current.talentNegative = answer.score;
                        current.talentNegativeElement = {
                            id: answer.scale.element.id,
                            name: answer.scale.element.name,
                            score: answer.score
                        };
                    }
                }
                else {
                    if (answer.scale.direction === 'positive') {
                        current.likePositive = answer.score;
                        current.likePositiveElement = {
                            id: answer.scale.element.id,
                            name: answer.scale.element.name,
                            score: answer.score
                        };
                    }
                    else {
                        current.likeNegative = answer.score;
                        current.likeNegativeElement = {
                            id: answer.scale.element.id,
                            name: answer.scale.element.name,
                            score: answer.score
                        };
                    }
                }
                dimensionMap.set(dimension, current);
            });
            const analysis = Array.from(dimensionMap.entries()).map(([dimension, scores]) => ({
                dimension,
                hasTalent: Boolean(scores.talentPositive &&
                    scores.talentNegative &&
                    scores.talentPositive <= 2 &&
                    scores.talentNegative >= 3),
                hasInterest: Boolean(scores.likePositive &&
                    scores.likeNegative &&
                    scores.likePositive <= 2 &&
                    scores.likeNegative >= 3),
                score: this.calculateScore(scores.talentPositive, scores.talentNegative, scores.likePositive, scores.likeNegative),
                elements: {
                    talent: {
                        positive: scores.talentPositiveElement ?
                            { elementId: scores.talentPositiveElement.id, name: scores.talentPositiveElement.name, score: scores.talentPositiveElement.score } :
                            { elementId: 0, name: '', score: 0 },
                        negative: scores.talentNegativeElement ?
                            { elementId: scores.talentNegativeElement.id, name: scores.talentNegativeElement.name, score: scores.talentNegativeElement.score } :
                            { elementId: 0, name: '', score: 0 }
                    },
                    interest: {
                        positive: scores.likePositiveElement ?
                            { elementId: scores.likePositiveElement.id, name: scores.likePositiveElement.name, score: scores.likePositiveElement.score } :
                            { elementId: 0, name: '', score: 0 },
                        negative: scores.likeNegativeElement ?
                            { elementId: scores.likeNegativeElement.id, name: scores.likeNegativeElement.name, score: scores.likeNegativeElement.score } :
                            { elementId: 0, name: '', score: 0 }
                    }
                }
            }));
            return {
                bothTalentAndInterest: analysis.filter(item => item.hasTalent && item.hasInterest),
                neitherTalentNorInterest: analysis.filter(item => !item.hasTalent && !item.hasInterest),
                onlyInterest: analysis.filter(item => !item.hasTalent && item.hasInterest),
                onlyTalent: analysis.filter(item => item.hasTalent && !item.hasInterest),
                rawAnalysis: analysis
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getReport(userId) {
        try {
            const latestAnswer = await this.scaleAnswerRepository.findOne({
                where: { userId },
                order: { submittedAt: 'DESC' }
            });
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
            return reportContent;
        }
        catch (error) {
            throw error;
        }
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [report_repository_1.ReportRepository])
], ReportService);
