import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/ChatSession';
import { ChatMessage } from '../entities/ChatMessage';
import { OpenAI } from 'openai';
import { AppDataSource } from '../data-source';
import { EventEmitter } from 'events';
import { UserAnalysisService } from './userAnalysis.service';
@Service()
export class ChatService {
    private openai: OpenAI;
    private sessionRepository: Repository<ChatSession>;
    private messageRepository: Repository<ChatMessage>;
    public eventEmitter: EventEmitter;
    private userAnalysisService: UserAnalysisService;
    constructor() {
        // 使用 AppDataSource 获取仓库实例
        this.sessionRepository = AppDataSource.getRepository(ChatSession);
        this.messageRepository = AppDataSource.getRepository(ChatMessage);
        this.userAnalysisService = new UserAnalysisService();
        
        // 初始化 OpenAI 客户端
        this.openai = new OpenAI({
            apiKey: "9f5ec5f8-1eb1-4c8f-b106-e648c9bc4241",
            baseURL: "https://ark.cn-beijing.volces.com/api/v3"
        });

        this.eventEmitter = new EventEmitter();
        // 设置最大监听器数量，避免内存泄漏警告
        this.eventEmitter.setMaxListeners(100);
    }

    async createSession(userId: number, title: string, canDelete: boolean) {
        const session = this.sessionRepository.create({ userId, title, canDelete });
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

    async processMessage(data: {userId: number, sessionId: number; role: "user" | "assistant"; content: string }) {
        try {
            console.log('开始处理消息:', data);
            
            // 1. 保存用户消息
            const userMessage = await this.addMessage(data.sessionId, data.role, data.content);
            
            if (data.role === 'user') {
                // 2. 创建空的AI消息并立即返回ID
                const aiMessage = await this.addMessage(data.sessionId, 'assistant', '');
                
                // 3. 异步处理AI响应
                this.processAIResponse(data.userId,data.sessionId, data.content, aiMessage.id).catch(error => {
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
        try {
            // 1. 首先删除与会话关联的所有消息
            await this.messageRepository.delete({ sessionId: id });
            console.log(`已删除会话 ${id} 的所有消息`);
            
            // 2. 然后删除会话本身
            await this.sessionRepository.delete(id);
            console.log(`已删除会话 ${id}`);
            
            return true;
        } catch (error) {
            console.error(`删除会话 ${id} 失败:`, error);
            throw new Error(`删除会话失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    // 添加用于发送流式更新的方法
    private sendStreamUpdate(messageId: number, content: string, sessionId: number) {
        try {
            const updateData = {
                messageId,
                content,
                sessionId  // 添加 sessionId
            };
            console.log('发送流更新:', updateData);
            
            // 确保消息能够立即发送，不受其他异步操作影响
            process.nextTick(() => {
                try {
                    const eventData = `data: ${JSON.stringify(updateData)}\n\n`;
                    
                    // 发送到特定会话的事件
                    this.eventEmitter.emit(`message-update-${sessionId}`, eventData);
                    console.log(`已发送事件到 message-update-${sessionId}`);
                    
                    // 同时发送到通用事件
                   // this.eventEmitter.emit('message-update', eventData);
                   // console.log('已发送事件到 message-update');
                } catch (err) {
                    console.error('事件发送失败:', err);
                }
            });
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
    private async processAIResponse(userId: number, sessionId: number, userContent: string, aiMessageId: number) {
        // 创建一个标志，表示请求是否已经完成
        let requestCompleted = false;
        let errorOccurred = false;
        let finalContent = ''; // 添加变量跟踪最终内容
        
        try {
            // 获取历史消息
            const sessionMessages = await this.getMessages(sessionId);
            const messageHistory = [];
            
            // 处理历史消息，过滤掉没有回复或回复为空的消息
            let i = 0;
            while (i < sessionMessages.length) {
                const currentMsg = sessionMessages[i];
                
                // 如果是用户消息，检查是否有有效的助手回复
                if (currentMsg.role === 'user') {
                    const nextMsg = i + 1 < sessionMessages.length ? sessionMessages[i + 1] : null;
                    
                    // 只有当存在有效的助手回复时，才添加这对消息
                    if (nextMsg && nextMsg.role === 'assistant' && nextMsg.content.trim()) {
                        messageHistory.push({
                            role: currentMsg.role,
                            content: currentMsg.content
                        });
                        
                        messageHistory.push({
                            role: nextMsg.role,
                            content: nextMsg.content
                        });
                        
                        i += 2; // 跳过已处理的助手消息
                    } else {
                        i++; // 没有有效回复，跳过这条用户消息
                    }
                } else {
                    // 如果是助手消息但前面没有用户消息(不应该发生)，跳过
                    i++;
                }
            }
            
            const userAnalysis = await this.userAnalysisService.getUserAnalysis(userId);
            const userContentFormatted = `基于用户信息回答:${userContent},用户信息: ${JSON.stringify(userAnalysis, null, 2)}`;
            console.log('userContentFormatted', userContentFormatted);
            
            // 设置请求超时和响应监控
            const controller = new AbortController();
            let lastResponseTime = Date.now();
            let checkInterval: NodeJS.Timeout | null = null;
            
            // 更新最后响应时间的函数
            const updateResponseTime = () => {
                lastResponseTime = Date.now();
            };
            
            // 无响应检测 - 这个更灵活，可以检测到流式响应中的停顿
            const noResponsePromise = new Promise<never>((_, reject) => {
                checkInterval = setInterval(async () => {
                    if (requestCompleted) {
                        if (checkInterval) clearInterval(checkInterval);
                        return;
                    }
                    
                    const timeSinceLastResponse = Date.now() - lastResponseTime;
                    
                    // 检查是否长时间无响应 (30秒)
                    if (timeSinceLastResponse > 30000) {
                        console.log('长时间未收到响应(30秒)，中断连接...');
                        controller.abort();
                        
                        // 直接发送无响应消息到前端
                        const noResponseMessage = '抱歉，长时间未收到响应(30秒)，请稍后重试。';
                        this.sendStreamUpdate(aiMessageId, noResponseMessage, sessionId);
                        
                        // 设置最终内容为超时消息
                        finalContent = noResponseMessage;
                        
                        // 确保数据库更新完成
                        try {
                            await this.messageRepository.update(aiMessageId, { content: noResponseMessage });
                            console.log('无响应消息已保存到数据库');
                        } catch (dbError) {
                            console.error('保存无响应消息失败:', dbError);
                        }
                        
                        errorOccurred = true;
                        if (checkInterval) clearInterval(checkInterval);
                        reject(new Error('长时间未收到响应(30秒)'));
                    }
                }, 5000); // 每5秒检查一次
            });
            
            try {
                console.log('发送到AI的消息历史:', messageHistory);
                
                // 创建AI请求Promise
                const aiRequestPromise = (async () => {
                    try {
                        // 创建流式请求
                        const stream = await this.openai.chat.completions.create({
                            model: 'deepseek-r1-250120',
                            messages: [
                                { role: 'system', content: "作为一名脑神经科学专家、心理学家、儿童发展专家、教育专家，请基于用户基础信息，给出个性化/针对性问题解决方案，说人话，不要使用AI语言，用户信息里面的ID等字段信息不要显示给用户，显示对应的具体内容。" },
                                ...messageHistory,
                                { role: 'user', content: userContentFormatted }
                            ],
                            stream: true,
                            temperature: 0.6,
                            max_tokens: 8192
                        }, {
                            signal: controller.signal
                        });

                        let content = '';

                        for await (const chunk of stream) {
                            // 更新最后响应时间
                            updateResponseTime();
                            
                            const chunkContent = chunk.choices[0]?.delta?.content || '';
                            if (chunkContent) {
                                content += chunkContent;
                                this.sendStreamUpdate(aiMessageId, content, sessionId);
                                
                                // 如果没有发生错误，更新最终内容
                                if (!errorOccurred) {
                                    finalContent = content;
                                }
                            }
                        }

                        // 不在这里更新数据库，而是在最后统一更新
                        return content;
                    } catch (error) {
                        if (error instanceof Error && error.name === 'AbortError') {
                            console.log('请求被中断，但错误已经处理');
                            // 不再抛出错误，因为已经在超时处理中发送了消息
                            return '';
                        }
                        throw error;
                    }
                })();
                
                // 使用Promise.race监控AI请求和无响应检测
                await Promise.race([aiRequestPromise, noResponsePromise]);
                
            } catch (error) {
                console.error('流处理中发生错误:', error);
                
                // 只有在没有发生超时错误的情况下才发送通用错误消息
                if (!errorOccurred) {
                    const errorMessage = `抱歉，处理您的请求时出现错误: ${error instanceof Error ? error.message : '请稍后重试'}`;
                    this.sendStreamUpdate(aiMessageId, errorMessage, sessionId);
                    finalContent = errorMessage; // 设置最终内容为错误消息
                    errorOccurred = true;
                }
                
                throw error;
            } finally {
                requestCompleted = true;
                if (checkInterval) clearInterval(checkInterval);
                
                // 在 finally 块中确保数据库更新
                try {
                    // 检查最终内容是否为空，如果为空且发生了错误，使用默认错误消息
                    if (!finalContent && errorOccurred) {
                        finalContent = '抱歉，处理您的请求时出现错误，请稍后重试。';
                    }
                    
                    // 确保最终内容不为空
                    if (finalContent) {
                        console.log(`保存最终内容到数据库: ${finalContent.substring(0, 50)}...`);
                        await this.messageRepository.update(aiMessageId, { content: finalContent });
                    }
                } catch (dbError) {
                    console.error('保存最终内容到数据库失败:', dbError);
                }
            }

        } catch (error) {
            console.error('AI处理失败:', error);
            
            // 只有在没有发生超时错误的情况下才发送通用错误消息
            if (!errorOccurred) {
                const errorMessage = `抱歉，处理您的请求时出现错误: ${error instanceof Error ? error.message : '请稍后重试'}`;
                this.sendStreamUpdate(aiMessageId, errorMessage, sessionId);
                
                // 设置最终内容为错误消息
                finalContent = errorMessage;
                
                // 更新数据库
                try {
                    await this.messageRepository.update(aiMessageId, { content: errorMessage });
                } catch (dbError) {
                    console.error('保存错误消息到数据库失败:', dbError);
                }
            }
        } finally {
            requestCompleted = true;
        }
    }

    // 添加根据标题查询会话的方法
    async findSessionByTitle(title: string, userId: string): Promise<ChatSession | undefined> {
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
            return session ;
        } catch (error) {
            return undefined;
        }
    }
}