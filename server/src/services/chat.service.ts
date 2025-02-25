import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/ChatSession';
import { ChatMessage } from '../entities/ChatMessage';
import { OpenAI } from 'openai';
import { AppDataSource } from '../data-source';
import { EventEmitter } from 'events';

@Service()
export class ChatService {
    private openai: OpenAI;
    private sessionRepository: Repository<ChatSession>;
    private messageRepository: Repository<ChatMessage>;
    public eventEmitter: EventEmitter;

    constructor() {
        // 使用 AppDataSource 获取仓库实例
        this.sessionRepository = AppDataSource.getRepository(ChatSession);
        this.messageRepository = AppDataSource.getRepository(ChatMessage);
        
        // 初始化 OpenAI 客户端
        this.openai = new OpenAI({
            apiKey: "sk-3dda0942e09c4945aba010492dd9e34f",
            baseURL: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com'
        });

        this.eventEmitter = new EventEmitter();
        // 设置最大监听器数量，避免内存泄漏警告
        this.eventEmitter.setMaxListeners(100);
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
        try {
            console.log('开始处理消息:', data);
            
            // 1. 保存用户消息
            const userMessage = await this.addMessage(data.sessionId, data.role, data.content);
            
            if (data.role === 'user') {
                // 2. 创建空的AI消息并立即返回ID
                const aiMessage = await this.addMessage(data.sessionId, 'assistant', '');
                
                // 3. 异步处理AI响应
                this.processAIResponse(data.sessionId, data.content, aiMessage.id).catch(error => {
                    console.error('AI响应处理失败:', error);
                });
                
                // 4. 立即返回两个消息的ID
                return { userMessage, aiMessage };
            }
            return { userMessage };
        } catch (error) {
            console.error('消息处理失败:', error);
            throw error;
        }
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
            order: { createdAt: 'ASC' },
            take: 100
        });
    }

    async deleteSession(id: number) {
        await this.sessionRepository.delete(id);
    }

    // 添加用于发送流式更新的方法
    private sendStreamUpdate(messageId: number, content: string) {
        try {
            const updateData = {
                messageId,
                content  
            };
            console.log('发送流更新:', updateData);
            
            const eventData = `data: ${JSON.stringify(updateData)}\n\n`;
            this.eventEmitter.emit('message-update', eventData);
        } catch (error) {
            console.error('发送流更新失败:', error);
        }
    }

    async deleteMessage(id: number) {
        try {
            await this.messageRepository.delete(id);
        } catch (error) {
            console.error('删除消息失败:', error);
            throw new Error('删除消息失败');
        }
    }

    // 新增方法：处理AI响应
    private async processAIResponse(sessionId: number, userContent: string, aiMessageId: number) {
        try {
            // 获取历史消息
            const sessionMessages = await this.getMessages(sessionId);
            const messageHistory = [];
            let lastRole: string | null = null;
            
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

            // 创建流式请求
            const stream = await this.openai.chat.completions.create({
                model: 'deepseek-reasoner',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    ...messageHistory,
                    { role: 'user', content: userContent }
                ],
                stream: true,
                temperature: 0.7,
                max_tokens: 2000
            });

            let content = '';

            for await (const chunk of stream) {
                const chunkContent = chunk.choices[0]?.delta?.content || '';
                if (!chunkContent) continue;
                
                content += chunkContent;
                this.sendStreamUpdate(aiMessageId, content);
            }

            // 保存最终内容
            await this.messageRepository.update(aiMessageId, { content });

        } catch (error) {
            console.error('AI处理失败:', error);
            this.sendStreamUpdate(aiMessageId, '抱歉，处理您的请求时出现错误，请稍后重试');
            await this.messageRepository.update(aiMessageId, { 
                content: '抱歉，处理您的请求时出现错误，请稍后重试'
            });
        }
    }
}