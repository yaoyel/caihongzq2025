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
let ChatService = class ChatService {
    openai;
    sessionRepository;
    messageRepository;
    eventEmitter;
    constructor() {
        // 使用 AppDataSource 获取仓库实例
        this.sessionRepository = data_source_1.AppDataSource.getRepository(ChatSession_1.ChatSession);
        this.messageRepository = data_source_1.AppDataSource.getRepository(ChatMessage_1.ChatMessage);
        // 初始化 OpenAI 客户端
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1'
        });
        this.eventEmitter = new events_1.EventEmitter();
        // 设置最大监听器数量，避免内存泄漏警告
        this.eventEmitter.setMaxListeners(100);
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
        console.log('开始处理消息:', { sessionId: data.sessionId, role: data.role });
        // 保存用户消息
        const userMessage = await this.addMessage(data.sessionId, data.role, data.content);
        console.log('用户消息已保存:', { messageId: userMessage.id });
        if (data.role === 'user') {
            try {
                // 获取并处理会话历史
                const sessionMessages = await this.getMessages(data.sessionId);
                // 构建有效消息历史
                const validHistory = [];
                let lastRole = null;
                // 过滤历史消息
                for (const msg of sessionMessages) {
                    // 系统消息直接添加
                    if (msg.role === 'system') {
                        validHistory.push({
                            role: msg.role,
                            content: msg.content
                        });
                        lastRole = null; // 重置最后角色
                        continue;
                    }
                    if (msg.role !== lastRole) {
                        validHistory.push({
                            role: msg.role,
                            content: msg.content
                        });
                        lastRole = msg.role;
                    }
                }
                // 检查最后一条消息角色
                if (validHistory[validHistory.length - 1].role === 'user') {
                    // 添加占位助手回复
                    validHistory.push({
                        role: 'assistant',
                        content: '[正在生成回复...]'
                    });
                }
                console.log('最终消息序列:', validHistory.map((m, i) => `${i}. ${m.role}: ${m.content.substring(0, 20)}`));
                // 创建一个空的 AI 消息
                const aiMessage = await this.addMessage(data.sessionId, 'assistant', '');
                console.log('AI消息已创建:', { messageId: aiMessage.id });
                try {
                    // 创建流式请求
                    const stream = await this.openai.chat.completions.create({
                        model: 'deepseek-reasoner',
                        messages: [
                            ...validHistory,
                            {
                                role: 'user',
                                content: data.content
                            }
                        ],
                        stream: true,
                        temperature: 0.7,
                        max_tokens: 2000
                    });
                    // 处理数据流
                    let answer = '';
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            answer += content;
                            // 每累积3个字符发送一次更新
                            if (answer.length % 3 === 0) {
                                console.log('发送更新, 当前长度:', answer.length);
                                this.sendStreamUpdate(aiMessage.id, answer, '');
                            }
                        }
                    }
                    // 更新最终消息
                    await this.messageRepository.update(aiMessage.id, { content: answer });
                    // 发送最后一次更新
                    this.sendStreamUpdate(aiMessage.id, answer, '');
                    return {
                        userMessage,
                        aiMessage: {
                            ...aiMessage,
                            content: answer
                        }
                    };
                }
                catch (error) {
                    console.error('Deepseek API调用失败:', error);
                    if (error.response) {
                        console.error('API错误:', {
                            status: error.response.status,
                            data: error.response.data
                        });
                    }
                    else {
                        console.error('网络错误:', error.message);
                    }
                    throw error;
                }
            }
            catch (error) {
                console.error('消息处理失败:', {
                    error: error.message,
                    sessionId: data.sessionId
                });
                throw new Error('AI处理消息失败');
            }
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
    // 添加用于发送流式更新的方法
    sendStreamUpdate(messageId, content, thinking) {
        const updateData = {
            messageId,
            content: content || '',
            thinking: thinking || '',
            timestamp: new Date().toISOString()
        };
        console.log('发送流更新:', {
            messageId,
            contentLength: content.length
        });
        this.eventEmitter.emit('message-update', updateData);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], ChatService);
