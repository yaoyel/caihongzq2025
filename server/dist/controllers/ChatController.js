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
const chat_service_1 = require("../services/chat.service");
const openai_1 = __importDefault(require("openai"));
let ChatController = class ChatController {
    constructor() {
        this.chatService = new chat_service_1.ChatService();
        this.openai = new openai_1.default({
            baseURL: 'https://api.deepseek.com/v1',
            apiKey: 'sk-c8a4469f28ad44c0aa4de8f58693de31'
        });
    }
    async createSession(data) {
        return await this.chatService.createSession(data.userId, data.title);
    }
    async getSessionsByUserId(userId) {
        return await this.chatService.getSessionsByUserId(userId);
    }
    async getSessionById(id) {
        const session = await this.chatService.getSessionById(id);
        if (!session) {
            throw new Error('会话不存在');
        }
        return session;
    }
    async addMessage(data) {
        // 保存用户消息
        const userMessage = await this.chatService.addMessage(data.sessionId, data.role, data.content);
        // 如果是用户消息，则调用DeepSeek API获取回复
        if (data.role === 'user') {
            try {
                const completion = await this.openai.chat.completions.create({
                    model: 'deepseek-reasoner',
                    messages: [{ role: 'user', content: data.content }],
                    temperature: 0.7
                });
                const aiContent = completion.choices[0].message.content;
                // 保存AI回复
                const aiMessage = await this.chatService.addMessage(data.sessionId, 'assistant', aiContent || '');
                return {
                    userMessage,
                    aiMessage
                };
            }
            catch (error) {
                console.error('调用DeepSeek API失败:', error);
                throw new Error('AI回复生成失败');
            }
        }
        return userMessage;
    }
    async shareSession(id) {
        const shareCode = await this.chatService.shareSession(id);
        return { shareCode };
    }
    async getSharedSession(shareCode) {
        const session = await this.chatService.getSessionByShareCode(shareCode);
        if (!session) {
            throw new Error('分享的会话不存在');
        }
        return session;
    }
    async updateSession(id, data) {
        const session = await this.chatService.getSessionById(id);
        if (!session) {
            throw new Error('会话不存在');
        }
        return await this.chatService.updateSession(id, data.title);
    }
    async deleteSession(id) {
        const session = await this.chatService.getSessionById(id);
        if (!session) {
            throw new Error('会话不存在');
        }
        await this.chatService.deleteSession(id);
        return { success: true };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, routing_controllers_1.Post)('/sessions'),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createSession", null);
__decorate([
    (0, routing_controllers_1.Get)('/sessions/user/:userId'),
    __param(0, (0, routing_controllers_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSessionsByUserId", null);
__decorate([
    (0, routing_controllers_1.Get)('/sessions/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSessionById", null);
__decorate([
    (0, routing_controllers_1.Post)('/messages'),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMessage", null);
__decorate([
    (0, routing_controllers_1.Post)('/sessions/:id/share'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "shareSession", null);
__decorate([
    (0, routing_controllers_1.Get)('/shared/:shareCode'),
    __param(0, (0, routing_controllers_1.Param)('shareCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSharedSession", null);
__decorate([
    (0, routing_controllers_1.Put)('/sessions/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateSession", null);
__decorate([
    (0, routing_controllers_1.Delete)('/sessions/:id'),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteSession", null);
exports.ChatController = ChatController = __decorate([
    (0, routing_controllers_1.JsonController)('/chat'),
    __metadata("design:paramtypes", [])
], ChatController);
//# sourceMappingURL=ChatController.js.map