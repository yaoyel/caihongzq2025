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
exports.ChatService = void 0;
const typedi_1 = require("typedi");
const ChatSession_1 = require("../entities/ChatSession");
const ChatMessage_1 = require("../entities/ChatMessage");
const openai_1 = require("openai");
const data_source_1 = require("../data-source");
let ChatService = class ChatService {
    openai;
    sessionRepository;
    messageRepository;
    constructor() {
        // 使用 AppDataSource 获取仓库实例
        this.sessionRepository = data_source_1.AppDataSource.getRepository(ChatSession_1.ChatSession);
        this.messageRepository = data_source_1.AppDataSource.getRepository(ChatMessage_1.ChatMessage);
        // 初始化 OpenAI 客户端
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1'
        });
    }
    async createSession(userId, title) {
        const session = this.sessionRepository.create({ userId, title });
        return this.sessionRepository.save(session);
    }
    async getSessions(userId) {
        return this.sessionRepository.find({
            where: { userId },
            relations: ['messages'],
            order: { updatedAt: 'DESC' }
        });
    }
    async getSessionById(id) {
        return this.sessionRepository.findOne({
            where: { id },
            relations: ['messages']
        });
    }
    async processMessage(data) {
        // 保存用户消息
        const userMessage = await this.addMessage(data.sessionId, data.role, data.content);
        if (data.role === 'user') {
            const completion = await this.openai.chat.completions.create({
                model: 'deepseek-reasoner',
                messages: [{ role: 'user', content: data.content }],
                temperature: 0.7
            });
            const aiContent = completion.choices[0].message.content;
            const aiMessage = await this.addMessage(data.sessionId, 'assistant', aiContent || '');
            return { userMessage, aiMessage };
        }
        return userMessage;
    }
    async addMessage(sessionId, role, content) {
        const message = this.messageRepository.create({ sessionId, role, content });
        return this.messageRepository.save(message);
    }
    async sendMessage(sessionId, content, role) {
        const message = this.messageRepository.create({
            sessionId,
            content,
            role
        });
        return this.messageRepository.save(message);
    }
    async shareSession(id) {
        const session = await this.sessionRepository.findOne({ where: { id } });
        if (!session) {
            throw new Error('会话不存在');
        }
        session.isShared = true;
        session.shareCode = Math.random().toString(36).substring(2, 10);
        await this.sessionRepository.save(session);
        return session.shareCode;
    }
    async getSessionByShareCode(shareCode) {
        return this.sessionRepository.findOne({
            where: { shareCode, isShared: true },
            relations: ['messages']
        });
    }
    async updateSession(id, title) {
        await this.sessionRepository.update(id, { title });
        return this.getSessionById(id);
    }
    async getMessages(sessionId) {
        return this.messageRepository.find({
            where: { sessionId },
            order: { createdAt: 'ASC' }
        });
    }
    async deleteSession(id) {
        await this.sessionRepository.delete(id);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], ChatService);
