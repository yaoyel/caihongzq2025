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
            apiKey: process.env.DEEPSEEK_API_KEY || "sk-7b5d228aeb7e41a988bfbc1cf61fbd48",
            baseURL: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1'
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
        // 保存用户消息
        const userMessage = await this.addMessage(data.sessionId, data.role, data.content);

        if (data.role === 'user') {
            try {
                const sessionMessages = await this.getMessages(data.sessionId);
                const messageHistory = sessionMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                // 创建一个空的 AI 消息用于后续更新
                const aiMessage = await this.addMessage(data.sessionId, 'assistant', '');

                // 使用流式输出获取思考过程
                const thinkingStream = await this.openai.chat.completions.create({
                    model: 'deepseek-reasoner',
                    messages: [
                        { 
                            role: 'system', 
                            content: '请先分析问题并说明思考过程。' 
                        },
                        { 
                            role: 'user', 
                            content: `请分析以下问题并说明思考过程：${data.content}\n\n历史对话：${messageHistory.map(m => `${m.role}: ${m.content}`).join('\n')}` 
                        }
                    ],
                    temperature: 0.7,
                    stream: true
                });

                let thinking = '';
                for await (const chunk of thinkingStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    thinking += content;
                    // 实时发送思考过程更新
                    this.sendStreamUpdate(aiMessage.id, '', thinking);
                }

                // 使用流式输出生成最终回答
                const answerStream = await this.openai.chat.completions.create({
                    model: 'deepseek-reasoner',
                    messages: [
                        { 
                            role: 'system', 
                            content: '基于分析给出清晰的回答。' 
                        },
                        { 
                            role: 'user', 
                            content: `${data.content}\n\n分析过程：${thinking}\n\n请基于以上分析给出回答。` 
                        }
                    ],
                    temperature: 0.7,
                    stream: true
                });

                let answer = '';
                for await (const chunk of answerStream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    answer += content;
                    // 实时发送回答更新
                    this.sendStreamUpdate(aiMessage.id, answer, thinking);
                }

                // 更新最终的 AI 消息
                await this.messageRepository.update(aiMessage.id, { content: answer });

                return { 
                    userMessage, 
                    aiMessage: {
                        ...aiMessage,
                        content: answer,
                        thinking
                    }
                };
            } catch (error) {
                console.error('AI处理消息失败:', error);
                throw new Error('AI处理消息失败');
            }
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

    // 添加用于发送流式更新的方法
    private sendStreamUpdate(messageId: number, content: string, thinking: string) {
        this.eventEmitter.emit('message-update', {
            messageId,
            content,
            thinking,
            timestamp: new Date().toISOString()
        });
    }
}