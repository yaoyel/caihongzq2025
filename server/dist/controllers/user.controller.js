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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const typedi_1 = require("typedi");
const user_service_1 = require("../services/user.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async login(userData) {
        const user = await this.userService.login(userData.code);
        // 生成 JWT token,过期时间设为30天
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
        return {
            user,
            token
        };
    }
    async getUser(id) {
        return await this.userService.findOne(id);
    }
};
exports.UserController = UserController;
__decorate([
    (0, routing_controllers_1.Post)('/login'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '用户登录' }),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "login", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_1.Authorized)(),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取用户信息' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
exports.UserController = UserController = __decorate([
    (0, routing_controllers_1.JsonController)('/users'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
