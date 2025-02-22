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
exports.ScaleService = void 0;
const typedi_1 = require("typedi");
const Scale_1 = require("../entities/Scale");
const ScaleAnswer_1 = require("../entities/ScaleAnswer");
const data_source_1 = require("../data-source");
let ScaleService = class ScaleService {
    scaleRepository;
    answerRepository;
    constructor() {
        this.scaleRepository = data_source_1.AppDataSource.getRepository(Scale_1.Scale);
        this.answerRepository = data_source_1.AppDataSource.getRepository(ScaleAnswer_1.ScaleAnswer);
    }
    async findAll(type, direction) {
        const query = this.scaleRepository.createQueryBuilder('scale')
            .leftJoinAndSelect('scale.element', 'element')
            .orderBy('scale.id', 'ASC');
        if (type) {
            query.andWhere('scale.type = :type', { type });
        }
        if (direction) {
            query.andWhere('scale.direction = :direction', { direction });
        }
        return query.getMany();
    }
    async findOne(id) {
        return this.scaleRepository.findOne({
            where: { id },
            relations: ['element']
        });
    }
    async submitAnswer(scaleId, data) {
        const answer = this.answerRepository.create({
            scaleId,
            ...data
        });
        return this.answerRepository.save(answer);
    }
    async getUserAnswers(userId) {
        return this.answerRepository.find({
            where: { userId },
            relations: ['scale', 'scale.element']
        });
    }
    async getUserAnswersSummary(userId) {
        const answers = await this.answerRepository
            .createQueryBuilder('answer')
            .leftJoinAndSelect('answer.scale', 'scale')
            .leftJoinAndSelect('scale.element', 'element')
            .where('answer.userId = :userId', { userId })
            .getMany();
        const dimensionScores = answers.reduce((acc, answer) => {
            const dimension = answer.scale.element.dimension;
            const score = answer.score;
            const existingDimension = acc.find(item => item.dimension === dimension);
            if (existingDimension) {
                existingDimension.total += score;
                existingDimension.count += 1;
            }
            else {
                acc.push({
                    dimension,
                    total: score,
                    count: 1
                });
            }
            return acc;
        }, []);
        return dimensionScores.map(item => ({
            dimension: item.dimension,
            score: item.total / item.count
        }));
    }
    async findByElements(elementIds) {
        return this.scaleRepository.createQueryBuilder('scale')
            .leftJoinAndSelect('scale.element', 'element')
            .where('element.id IN (:...elementIds)', { elementIds })
            .orderBy('scale.id', 'ASC')
            .getMany();
    }
};
exports.ScaleService = ScaleService;
exports.ScaleService = ScaleService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], ScaleService);
