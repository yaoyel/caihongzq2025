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
exports.ScaleAnswerRepository = void 0;
const ScaleAnswer_1 = require("../entities/ScaleAnswer");
const typedi_1 = require("typedi");
const data_source_1 = require("../data-source");
let ScaleAnswerRepository = class ScaleAnswerRepository {
    repository;
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(ScaleAnswer_1.ScaleAnswer);
    }
    async findLatestByUserId(userId) {
        return this.repository.createQueryBuilder('answer')
            .where('answer.userId = :userId', { userId })
            .orderBy('answer.submittedAt', 'DESC')
            .getOne();
    }
    async findAllByUserIdWithScale(userId) {
        return this.repository.createQueryBuilder('answer')
            .leftJoinAndSelect('answer.scale', 'scale')
            .where('answer.userId = :userId', { userId })
            .getMany();
    }
};
exports.ScaleAnswerRepository = ScaleAnswerRepository;
exports.ScaleAnswerRepository = ScaleAnswerRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], ScaleAnswerRepository);
