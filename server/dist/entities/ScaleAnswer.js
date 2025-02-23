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
exports.ScaleAnswer = void 0;
const typeorm_1 = require("typeorm");
const Scale_1 = require("./Scale");
const User_1 = require("./User");
let ScaleAnswer = class ScaleAnswer {
    id;
    scaleId;
    userId;
    score;
    submittedAt;
    scale;
    user;
};
exports.ScaleAnswer = ScaleAnswer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ScaleAnswer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scale_id' }),
    __metadata("design:type", Number)
], ScaleAnswer.prototype, "scaleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], ScaleAnswer.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'score' }),
    __metadata("design:type", Number)
], ScaleAnswer.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'submitted_at' }),
    __metadata("design:type", Date)
], ScaleAnswer.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Scale_1.Scale),
    (0, typeorm_1.JoinColumn)({ name: 'scale_id' }),
    __metadata("design:type", Scale_1.Scale)
], ScaleAnswer.prototype, "scale", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], ScaleAnswer.prototype, "user", void 0);
exports.ScaleAnswer = ScaleAnswer = __decorate([
    (0, typeorm_1.Entity)('scale_answers')
], ScaleAnswer);
