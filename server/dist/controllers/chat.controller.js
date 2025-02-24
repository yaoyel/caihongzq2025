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
exports.ChatController = void 0;
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const typedi_1 = require("typedi");
const chat_service_1 = require("../services/chat.service");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getSessions(userId) {
        return await this.chatService.getSessions(userId);
    }
    async getSharedSession(shareCode) {
        return await this.chatService.getSessionByShareCode(shareCode);
    }
    async sendMessage(data) {
        return await this.chatService.sendMessage(data.sessionId, data.content, data.role);
    }
    async shareSession(id) {
        return await this.chatService.shareSession(id);
    }
    async updateSession(id, data) {
        return await this.chatService.updateSession(id, data.title);
    }
    async createSession(data) {
        // 如果title未定义则使用空字符串作为默认值
        const sessionTitle = data.title || '';
        return await this.chatService.createSession(data.userId, sessionTitle);
    }
    async getSessionMessages(sessionId) {
        return await this.chatService.getMessages(sessionId);
    }
    async deleteSession(id) {
        await this.chatService.deleteSession(id);
        return { success: true };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, routing_controllers_1.Get)('/sessions/user/:userId'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取用户的聊天会话列表' }),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSessions", null);
__decorate([
    (0, routing_controllers_1.Get)('/sessions/shared/:shareCode'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取共享的聊天会话' }),
    __param(0, (0, routing_controllers_1.Param)('shareCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSharedSession", null);
__decorate([
    (0, routing_controllers_1.Post)('/messages'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '发送消息' }),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, routing_controllers_1.Put)('/sessions/:id/share'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '分享聊天会话' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "shareSession", null);
__decorate([
    (0, routing_controllers_1.Put)('/sessions/:id'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '更新会话标题' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateSession", null);
__decorate([
    (0, routing_controllers_1.Post)('/sessions'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '创建聊天会话' }),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createSession", null);
__decorate([
    (0, routing_controllers_1.Get)('/sessions/:sessionId/messages'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '获取会话的消息列表' }),
    __param(0, (0, routing_controllers_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSessionMessages", null);
__decorate([
    (0, routing_controllers_1.Delete)('/sessions/:id'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '删除聊天会话' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteSession", null);
exports.ChatController = ChatController = __decorate([
    (0, routing_controllers_1.JsonController)('/chat'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
