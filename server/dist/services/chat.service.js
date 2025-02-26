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
const events_1 = require("events");
const userAnalysis_service_1 = require("./userAnalysis.service");
let ChatService = class ChatService {
    openai;
    sessionRepository;
    messageRepository;
    eventEmitter;
    userAnalysisService;
    constructor() {
        // 使用 AppDataSource 获取仓库实例
        this.sessionRepository = data_source_1.AppDataSource.getRepository(ChatSession_1.ChatSession);
        this.messageRepository = data_source_1.AppDataSource.getRepository(ChatMessage_1.ChatMessage);
        this.userAnalysisService = new userAnalysis_service_1.UserAnalysisService();
        // 初始化 OpenAI 客户端
        this.openai = new openai_1.OpenAI({
            apiKey: "sk-3dda0942e09c4945aba010492dd9e34f",
            baseURL: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com'
        });
        this.eventEmitter = new events_1.EventEmitter();
        // 设置最大监听器数量，避免内存泄漏警告
        this.eventEmitter.setMaxListeners(100);
    }
    async createSession(userId, title, canDelete) {
        const session = this.sessionRepository.create({ userId, title, canDelete });
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
        try {
            console.log('开始处理消息:', data);
            // 1. 保存用户消息
            const userMessage = await this.addMessage(data.sessionId, data.role, data.content);
            if (data.role === 'user') {
                // 2. 创建空的AI消息并立即返回ID
                const aiMessage = await this.addMessage(data.sessionId, 'assistant', '');
                // 3. 异步处理AI响应
                this.processAIResponse(data.userId, data.sessionId, data.content, aiMessage.id).catch(error => {
                    console.error('AI响应处理失败:', error);
                });
                // 4. 立即返回两个消息的ID
                return { userMessage, aiMessage };
            }
            return { userMessage };
        }
        catch (error) {
            console.error('消息处理失败:', error);
            throw error;
        }
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
            order: { createdAt: 'ASC' },
            take: 100
        });
    }
    async deleteSession(id) {
        await this.sessionRepository.delete(id);
    }
    // 添加用于发送流式更新的方法
    sendStreamUpdate(messageId, content) {
        try {
            const updateData = {
                messageId,
                content
            };
            console.log('发送流更新:', updateData);
            const eventData = `data: ${JSON.stringify(updateData)}\n\n`;
            this.eventEmitter.emit('message-update', eventData);
        }
        catch (error) {
            console.error('发送流更新失败:', error);
        }
    }
    async deleteMessage(id) {
        try {
            await this.messageRepository.delete(id);
        }
        catch (error) {
            console.error('删除消息失败:', error);
            throw new Error('删除消息失败');
        }
    }
    // 新增方法：处理AI响应
    async processAIResponse(userId, sessionId, userContent, aiMessageId) {
        try {
            // 获取历史消息
            const sessionMessages = await this.getMessages(sessionId);
            const messageHistory = [];
            let lastRole = null;
            // 处理历史消息，确保交替顺序
            for (const msg of sessionMessages) {
                if (msg.role !== lastRole) {
                    messageHistory.push({
                        role: msg.role,
                        content: msg.content
                    });
                    lastRole = msg.role;
                }
            }
            const userAnalysis = await this.userAnalysisService.getUserAnalysis(userId);
            const userContentFormatted = `基于用户信息回答:${userContent},用户信息: ${JSON.stringify(userAnalysis, null, 2)}`;
            console.log('userContentFormatted', userContentFormatted);
            // 创建流式请求
            const stream = await this.openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: "作为一名脑神经科学专家、心理学家、儿童发展专家、教育专家，请基于用户基础信息，给出个性化/针对性问题解决方案，说人话，不要使用AI语言，用户信息里面的ID等字段信息不要显示给用户，显示对应的具体内容。" },
                    ...messageHistory,
                    { role: 'user', content: userContentFormatted }
                ],
                stream: true,
                temperature: 0.6,
                max_tokens: 8192
            });
            let content = '';
            for await (const chunk of stream) {
                const chunkContent = chunk.choices[0]?.delta?.content || '';
                if (!chunkContent)
                    continue;
                content += chunkContent;
                this.sendStreamUpdate(aiMessageId, content);
            }
            // 保存最终内容
            await this.messageRepository.update(aiMessageId, { content });
        }
        catch (error) {
            console.error('AI处理失败:', error);
            this.sendStreamUpdate(aiMessageId, '抱歉，处理您的请求时出现错误，请稍后重试');
            await this.messageRepository.update(aiMessageId, {
                content: '抱歉，处理您的请求时出现错误，请稍后重试'
            });
        }
    }
    // 添加根据标题查询会话的方法
    async findSessionByTitle(title, userId) {
        try {
            const session = await this.sessionRepository.findOne({
                where: {
                    title: title,
                    userId: parseInt(userId)
                }
            });
            if (!session) {
                return undefined;
            }
            return session;
        }
        catch (error) {
            return undefined;
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], ChatService);
