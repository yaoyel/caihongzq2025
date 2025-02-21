import { AppDataSource } from '../data-source';
import { ChatSession } from '../entity/ChatSession';
import { ChatMessage } from '../entity/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
    private chatSessionRepository = AppDataSource.getRepository(ChatSession);
    private chatMessageRepository = AppDataSource.getRepository(ChatMessage);

    public async createSession(userId: number, title: string): Promise<ChatSession> {
        const session = new ChatSession();
        session.userId = userId;
        session.title = title;
        return await this.chatSessionRepository.save(session);
    }

    public async getSessionsByUserId(userId: number): Promise<ChatSession[]> {
        return await this.chatSessionRepository.find({
            where: { userId },
            order: { updatedAt: 'DESC' },
            relations: ['messages']
        });
    }

    public async getSessionById(id: number): Promise<ChatSession | null> {
        return await this.chatSessionRepository.findOne({
            where: { id },
            relations: ['messages']
        });
    }

    public async addMessage(sessionId: number, role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
        const message = new ChatMessage();
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

    public async shareSession(sessionId: number): Promise<string> {
        const session = await this.chatSessionRepository.findOne({
            where: { id: sessionId }
        });

        if (!session) {
            throw new Error('会话不存在');
        }

        session.isShared = true;
        session.shareCode = uuidv4().replace(/-/g, '').substring(0, 8);
        await this.chatSessionRepository.save(session);

        return session.shareCode;
    }

    public async getSessionByShareCode(shareCode: string): Promise<ChatSession | null> {
        return await this.chatSessionRepository.findOne({
            where: { shareCode, isShared: true },
            relations: ['messages']
        });
    }

    public async updateSession(id: number, title: string): Promise<ChatSession> {
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

    public async deleteSession(id: number): Promise<void> {
        await this.chatMessageRepository.delete({ sessionId: id });
        await this.chatSessionRepository.delete(id);
    }
}