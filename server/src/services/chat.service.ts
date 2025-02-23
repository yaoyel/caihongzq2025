import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/ChatSession';
import { ChatMessage } from '../entities/ChatMessage';
import { OpenAI } from 'openai';
import { AppDataSource } from '../data-source';

@Service()
export class ChatService {
    private openai: OpenAI;
    private sessionRepository: Repository<ChatSession>;
    private messageRepository: Repository<ChatMessage>;

    constructor() {
        // 使用 AppDataSource 获取仓库实例
        this.sessionRepository = AppDataSource.getRepository(ChatSession);
        this.messageRepository = AppDataSource.getRepository(ChatMessage);
        
        // 初始化 OpenAI 客户端
        this.openai = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1'
        });
    }

    async createSession(userId: number, title: string) {
        const session = this.sessionRepository.create({ userId, title });
        return this.sessionRepository.save(session);
    }

    async getSessions(userId: number) {
        return this.sessionRepository.find({
            where: { userId },
            relations: ['messages'],
            order: { updatedAt: 'DESC' }
        });
    }

    async getSessionById(id: number) {
        return this.sessionRepository.findOne({ 
            where: { id },
            relations: ['messages']
        });
    }

    async processMessage(data: { sessionId: number; role: "user" | "assistant"; content: string }) {
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

    async addMessage(sessionId: number, role: "user" | "assistant", content: string) {
        const message = this.messageRepository.create({ sessionId, role, content });
        return this.messageRepository.save(message);
    }

    async sendMessage(sessionId: number, content: string, role: 'user' | 'assistant') {
        const message = this.messageRepository.create({
            sessionId,
            content,
            role
        });
        return this.messageRepository.save(message);
    }

    async shareSession(id: number) {
        const session = await this.sessionRepository.findOne({ where: { id } });
        if (!session) {
            throw new Error('会话不存在');
        }
        session.isShared = true;
        session.shareCode = Math.random().toString(36).substring(2, 10);
        await this.sessionRepository.save(session);
        return session.shareCode;
    }

    async getSessionByShareCode(shareCode: string) {
        return this.sessionRepository.findOne({
            where: { shareCode, isShared: true },
            relations: ['messages']
        });
    }

    async updateSession(id: number, title: string) {
        await this.sessionRepository.update(id, { title });
        return this.getSessionById(id);
    }

    async getMessages(sessionId: number) {
        return this.messageRepository.find({
            where: { sessionId },
            order: { createdAt: 'ASC' }
        });
    }

    async deleteSession(id: number) {
        await this.sessionRepository.delete(id);
    }
}