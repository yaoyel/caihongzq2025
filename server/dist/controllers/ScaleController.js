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
exports.ScaleController = void 0;
const routing_controllers_1 = require("routing-controllers");
const data_source_1 = require("../data-source");
const Scale_1 = require("../entity/Scale");
const ScaleAnswer_1 = require("../entity/ScaleAnswer");
let ScaleController = class ScaleController {
    constructor() {
        this.scaleRepository = data_source_1.AppDataSource.getRepository(Scale_1.Scale);
        this.answerRepository = data_source_1.AppDataSource.getRepository(ScaleAnswer_1.ScaleAnswer);
    }
    async getAll(type, direction) {
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
    async getOne(id) {
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
exports.ScaleController = ScaleController;
__decorate([
    (0, routing_controllers_1.Get)(),
    __param(0, (0, routing_controllers_1.QueryParam)('type')),
    __param(1, (0, routing_controllers_1.QueryParam)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "getAll", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "getOne", null);
__decorate([
    (0, routing_controllers_1.Post)('/:id/answers'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "submitAnswer", null);
__decorate([
    (0, routing_controllers_1.Get)('/answers/user/:userId'),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScaleController.prototype, "getUserAnswers", null);
exports.ScaleController = ScaleController = __decorate([
    (0, routing_controllers_1.JsonController)('/scales')
], ScaleController);
//# sourceMappingURL=ScaleController.js.map