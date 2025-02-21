"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScaleAnswerRepository = void 0;
const typeorm_1 = require("typeorm");
const ScaleAnswer_1 = require("../entities/ScaleAnswer");
const typedi_1 = require("typedi");
let ScaleAnswerRepository = class ScaleAnswerRepository extends typeorm_1.Repository {
    async findLatestByUserId(userId) {
        return this.createQueryBuilder('answer')
            .where('answer.userId = :userId', { userId })
            .orderBy('answer.submittedAt', 'DESC')
            .getOne();
    }
    async findAllByUserIdWithScale(userId) {
        return this.createQueryBuilder('answer')
            .leftJoinAndSelect('answer.scale', 'scale')
            .where('answer.userId = :userId', { userId })
            .getMany();
    }
};
exports.ScaleAnswerRepository = ScaleAnswerRepository;
exports.ScaleAnswerRepository = ScaleAnswerRepository = __decorate([
    (0, typedi_1.Service)(),
    (0, typeorm_1.EntityRepository)(ScaleAnswer_1.ScaleAnswer)
], ScaleAnswerRepository);
