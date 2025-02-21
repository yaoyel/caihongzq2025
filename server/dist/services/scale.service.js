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
exports.ScaleService = void 0;
const typedi_1 = require("typedi");
const typeorm_typedi_extensions_1 = require("typeorm-typedi-extensions");
const typeorm_1 = require("typeorm");
const Scale_1 = require("../entities/Scale");
const ScaleAnswer_1 = require("../entities/ScaleAnswer");
let ScaleService = class ScaleService {
    scaleRepository;
    answerRepository;
    constructor(scaleRepository, answerRepository) {
        this.scaleRepository = scaleRepository;
        this.answerRepository = answerRepository;
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
};
exports.ScaleService = ScaleService;
exports.ScaleService = ScaleService = __decorate([
    (0, typedi_1.Service)(),
    __param(0, (0, typeorm_typedi_extensions_1.InjectRepository)(Scale_1.Scale)),
    __param(1, (0, typeorm_typedi_extensions_1.InjectRepository)(ScaleAnswer_1.ScaleAnswer)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository])
], ScaleService);
