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
exports.UserController = void 0;
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const typedi_1 = require("typedi");
const user_service_1 = require("../services/user.service");
const logger_1 = require("../config/logger");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async login(userData) {
        try {
            return await this.userService.login(userData.code);
        }
        catch (error) {
            logger_1.logger.error({ userData, error }, 'Failed to login');
            throw error;
        }
    }
    async getUser(id) {
        try {
            return await this.userService.findOne(id);
        }
        catch (error) {
            logger_1.logger.error({ id, error }, 'Failed to get user');
            throw error;
        }
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
