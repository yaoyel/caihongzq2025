import { JsonController, Get, Post, Put, Body, Param, QueryParam, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { QuestionService } from '../services/question.service';
import { logger } from '../config/logger';

@JsonController('/questions')
@Service()
export class QuestionController {
    constructor(private questionService: QuestionService) {}

    @Get()
    @OpenAPI({ summary: '获取问题列表' })
    async getAll(@QueryParam('ageRange') ageRange: '4-8' | '9-14' | '14+') {
        try {
            if (!ageRange) {
                throw new Error('必须指定年龄段');
            }
            return await this.questionService.findByAgeRange(ageRange);
        } catch (error) {
            logger.error({ ageRange, error }, 'Failed to get questions');
            throw error;
        }
    }

    @Get('/answers/user/:userId')
    @OpenAPI({ summary: '获取用户的答案' })
    async getUserAnswers(
        @Param('userId') userId: number,
        @QueryParam('ageRange') ageRange?: '4-8' | '9-14' | '14+'
    ) {
        try {
            return await this.questionService.getUserAnswers(userId, ageRange);
        } catch (error) {
            logger.error({ userId, ageRange, error }, 'Failed to get user answers');
            throw error;
        }
    }

    @Get('/answers/user/:userId/summary')
    @OpenAPI({ summary: '获取用户答案摘要' })
    async getUserAnswerSummary(
        @Param('userId') userId: number,
        @QueryParam('ageRange') ageRange: '4-8' | '9-14' | '14+'
    ) {
        try {
            return await this.questionService.getUserAnswerSummary(userId, ageRange);
        } catch (error) {
            logger.error({ userId, ageRange, error }, 'Failed to get answer summary');
            throw error;
        }
    }

    @Post('/:id/answers')
    @OpenAPI({ summary: '提交答案' })
    async submitAnswer(
        @Param('id') questionId: number,
        @Body() data: { userId: number; content: string; submittedBy: string }
    ) {
        try {
            return await this.questionService.submitAnswer(questionId, data);
        } catch (error) {
            logger.error({ questionId, data, error }, 'Failed to submit answer');
            throw error;
        }
    }

    @Put('/answers/:id')
    @OpenAPI({ summary: '更新答案' })
    async updateAnswer(
        @Param('id') id: number,
        @Body() data: { content: string }
    ) {
        try {
            return await this.questionService.updateAnswer(id, data.content);
        } catch (error) {
            logger.error({ id, data, error }, 'Failed to update answer');
            throw error;
        }
    }
} 