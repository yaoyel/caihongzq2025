import { JsonController, Get, Post, Put, Delete, Body, Param } from 'routing-controllers';
import { ChatService } from '../services/chat.service';
import OpenAI from 'openai';

@JsonController('/chat')
export class ChatController {
    private chatService: ChatService;

    private openai: OpenAI;

    constructor() {
        this.chatService = new ChatService();
        this.openai = new OpenAI({
            baseURL: 'https://api.deepseek.com/v1',
            apiKey: 'sk-c8a4469f28ad44c0aa4de8f58693de31'
        });
    }

    @Post('/sessions')
    async createSession(@Body() data: { userId: number; title: string }) {
        return await this.chatService.createSession(data.userId, data.title);
    }

    @Get('/sessions/user/:userId')
    async getSessionsByUserId(@Param('userId') userId: number) {
        return await this.chatService.getSessionsByUserId(userId);
    }

    @Get('/sessions/:id')
    async getSessionById(@Param('id') id: number) {
        const session = await this.chatService.getSessionById(id);
        if (!session) {
            throw new Error('会话不存在');
        }
        return session;
    }

    @Post('/messages')
    async addMessage(@Body() data: { sessionId: number; role: "user" | "assistant"; content: string }) {
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
            } catch (error) {
                console.error('调用DeepSeek API失败:', error);
                throw new Error('AI回复生成失败');
            }
        }

        return userMessage;
    }

    @Post('/sessions/:id/share')
    async shareSession(@Param('id') id: number) {
        const shareCode = await this.chatService.shareSession(id);
        return { shareCode };
    }

    @Get('/shared/:shareCode')
    async getSharedSession(@Param('shareCode') shareCode: string) {
        const session = await this.chatService.getSessionByShareCode(shareCode);
        if (!session) {
            throw new Error('分享的会话不存在');
        }
        return session;
    }

    @Put('/sessions/:id')
    async updateSession(@Param('id') id: number, @Body() data: { title: string }) {
        const session = await this.chatService.getSessionById(id);
        if (!session) {
            throw new Error('会话不存在');
        }
        return await this.chatService.updateSession(id, data.title);
    }

    @Delete('/sessions/:id')
    async deleteSession(@Param('id') id: number) {
        const session = await this.chatService.getSessionById(id);
        if (!session) {
            throw new Error('会话不存在');
        }
        await this.chatService.deleteSession(id);
        return { success: true };
    }
}