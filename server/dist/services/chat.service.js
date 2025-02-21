"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const data_source_1 = require("../data-source");
const ChatSession_1 = require("../entity/ChatSession");
const ChatMessage_1 = require("../entity/ChatMessage");
const uuid_1 = require("uuid");
class ChatService {
    constructor() {
        this.chatSessionRepository = data_source_1.AppDataSource.getRepository(ChatSession_1.ChatSession);
        this.chatMessageRepository = data_source_1.AppDataSource.getRepository(ChatMessage_1.ChatMessage);
    }
    async createSession(userId, title) {
        const session = new ChatSession_1.ChatSession();
        session.userId = userId;
        session.title = title;
        return await this.chatSessionRepository.save(session);
    }
    async getSessionsByUserId(userId) {
        return await this.chatSessionRepository.find({
            where: { userId },
            order: { updatedAt: 'DESC' },
            relations: ['messages']
        });
    }
    async getSessionById(id) {
        return await this.chatSessionRepository.findOne({
            where: { id },
            relations: ['messages']
        });
    }
    async addMessage(sessionId, role, content) {
        const message = new ChatMessage_1.ChatMessage();
        message.sessionId = sessionId;
        message.role = role;
        message.content = content;
        const savedMessage = await this.chatMessageRepository.save(message);
        // 更新会话的更新时间
        await this.chatSessionRepository.update(sessionId, {
            updatedAt: new Date()
        });
        return savedMessage;
    }
    async shareSession(sessionId) {
        const session = await this.chatSessionRepository.findOne({
            where: { id: sessionId }
        });
        if (!session) {
            throw new Error('会话不存在');
        }
        session.isShared = true;
        session.shareCode = (0, uuid_1.v4)().replace(/-/g, '').substring(0, 8);
        await this.chatSessionRepository.save(session);
        return session.shareCode;
    }
    async getSessionByShareCode(shareCode) {
        return await this.chatSessionRepository.findOne({
            where: { shareCode, isShared: true },
            relations: ['messages']
        });
    }
    async updateSession(id, title) {
        await this.chatSessionRepository.update(id, { title });
        const updatedSession = await this.chatSessionRepository.findOne({
            where: { id },
            relations: ['messages']
        });
        if (!updatedSession) {
            throw new Error('会话不存在');
        }
        return updatedSession;
    }
    async deleteSession(id) {
        await this.chatMessageRepository.delete({ sessionId: id });
        await this.chatSessionRepository.delete(id);
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map