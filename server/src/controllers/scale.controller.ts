import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ScaleService } from '../services/scale.service';
import { logger } from '../config/logger';

@JsonController('/scales')
@Service()
export class ScaleController {
    constructor(private scaleService: ScaleService) {}

    @Get()
    @OpenAPI({ summary: '获取量表列表' })
    async getAll(
        @QueryParam('type') type?: 'like' | 'talent',
        @QueryParam('direction') direction?: 'positive' | 'negative'
    ) {
        try {
            return await this.scaleService.findAll(type, direction);
        } catch (error) {
            logger.error({ type, direction, error }, 'Failed to get scales');
            throw error;
        }
    }

    @Get('/:id')
    @OpenAPI({ summary: '获取量表详情' })
    async getOne(@Param('id') id: number) {
        try {
            return await this.scaleService.findOne(id);
        } catch (error) {
            logger.error({ id, error }, 'Failed to get scale');
            throw error;
        }
    }

    @Post('/:id/answers')
    @OpenAPI({ summary: '提交量表答案' })
    async submitAnswer(
        @Param('id') scaleId: number,
        @Body() data: { userId: number; score: number }
    ) {
        try {
            return await this.scaleService.submitAnswer(scaleId, data);
        } catch (error) {
            logger.error({ scaleId, data, error }, 'Failed to submit answer');
            throw error;
        }
    }

    @Get('/answers/user/:userId')
    @OpenAPI({ summary: '获取用户的量表答案' })
    async getUserAnswers(@Param('userId') userId: number) {
        try {
            return await this.scaleService.getUserAnswers(userId);
        } catch (error) {
            logger.error({ userId, error }, 'Failed to get user answers');
            throw error;
        }
    }
} 