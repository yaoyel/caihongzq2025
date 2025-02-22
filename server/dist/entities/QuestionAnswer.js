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
exports.QuestionAnswer = void 0;
const typeorm_1 = require("typeorm");
const Question_1 = require("./Question");
const User_1 = require("./User");
let QuestionAnswer = class QuestionAnswer {
    id;
    userId;
    questionId;
    content;
    submittedAt;
    submittedBy;
    lastModifiedAt;
    question;
    user;
};
exports.QuestionAnswer = QuestionAnswer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    (0, typeorm_1.Generated)('increment'),
    __metadata("design:type", Number)
], QuestionAnswer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], QuestionAnswer.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'question_id' }),
    __metadata("design:type", Number)
], QuestionAnswer.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'content' }),
    __metadata("design:type", String)
], QuestionAnswer.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'submitted_at' }),
    __metadata("design:type", Date)
], QuestionAnswer.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'submitted_by' }),
    __metadata("design:type", String)
], QuestionAnswer.prototype, "submittedBy", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_modified_at' }),
    __metadata("design:type", Date)
], QuestionAnswer.prototype, "lastModifiedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Question_1.Question),
    __metadata("design:type", Question_1.Question)
], QuestionAnswer.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    __metadata("design:type", User_1.User)
], QuestionAnswer.prototype, "user", void 0);
exports.QuestionAnswer = QuestionAnswer = __decorate([
    (0, typeorm_1.Entity)('question_answers'),
    (0, typeorm_1.Unique)(['userId', 'questionId'])
], QuestionAnswer);
