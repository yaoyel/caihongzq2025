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
exports.ChatController = void 0;
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const typedi_1 = require("typedi");
const chat_service_1 = require("../services/chat.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
        // 调用 processMessage 来处理消息并获取 AI 响应
        const result = await this.chatService.processMessage({
            userId: data.userId,
            sessionId: data.sessionId,
            content: data.content,
            role: data.role
        });
        return result; // 这将返回 { userMessage, aiMessage } 对象
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
        return await this.chatService.createSession(data.userId, sessionTitle, data.can_delete || false);
    }
    async getSessionMessages(sessionId) {
        return await this.chatService.getMessages(sessionId);
    }
    async deleteSession(id) {
        await this.chatService.deleteSession(id);
        return { success: true };
    }
    async stream(ctx, token) {
        // 添加token验证
        if (!token || !jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET)) {
            ctx.status = 401;
            return;
        }
        ctx.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        ctx.status = 200;
        ctx.flushHeaders();
        const listener = (data) => {
            // 修改：添加事件类型和确保正确的SSE格式
            ctx.res.write(`event: message-update\ndata: ${JSON.stringify(data)}\n\n`);
        };
        this.chatService.eventEmitter.on('message-update', listener);
        // 发送初始连接成功消息
        ctx.res.write('event: connected\ndata: {"status":"connected"}\n\n');
        ctx.req.on('close', () => {
            this.chatService.eventEmitter.off('message-update', listener);
            ctx.res.end();
        });
        return new Promise((resolve) => {
            ctx.req.on('close', resolve);
        });
    }
    async deleteMessage(id) {
        try {
            await this.chatService.deleteMessage(id);
            return { message: '消息删除成功' };
        }
        catch (error) {
            return { error: '删除消息失败' };
        }
    }
    async findSessionByTitle(title, userId) {
        try {
            const session = await this.chatService.findSessionByTitle(title, userId);
            if (!session) {
                return null;
            }
            return session;
        }
        catch (error) {
            throw new Error('获取聊天会话失败');
        }
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
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: '发送消息并处理AI响应' }),
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
__decorate([
    (0, routing_controllers_1.Get)('/stream'),
    __param(0, (0, routing_controllers_1.Res)()),
    __param(1, (0, routing_controllers_1.QueryParam)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "stream", null);
__decorate([
    (0, routing_controllers_1.Delete)('/messages/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, routing_controllers_1.Get)('/sessions/findByTitle'),
    __param(0, (0, routing_controllers_1.QueryParam)('title')),
    __param(1, (0, routing_controllers_1.QueryParam)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "findSessionByTitle", null);
exports.ChatController = ChatController = __decorate([
    (0, routing_controllers_1.JsonController)('/chat'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
