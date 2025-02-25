import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam, QueryParams, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ScaleService } from '../services/scale.service';
import { AppDataSource } from '../data-source';
import { ScaleAnswer } from '../entities/ScaleAnswer';

@JsonController('/scales')
@Service()
export class ScaleController {
    constructor(private scaleService: ScaleService) {}

    @Get('/by-elements')
    @OpenAPI({ summary: '通过元素ID列表获取量表' })
    async getByElements(@QueryParam('ids') elementIds: string) {
        if (!elementIds || elementIds.trim() === '') {
            return [];
        }
        try {
            // 移除所有空格，然后按逗号分割
            const elementIdArray = elementIds
                .trim()
                .split(',')
                .map(Number)
                .filter(id => !isNaN(id) && id > 0);

            if (elementIdArray.length === 0) {
                return [];
            }
            return await this.scaleService.findByElements(elementIdArray);
        } catch (error) {
            console.error('Error in getByElements:', error);
            return [];
        }
    }
    
    
    @Get()
    @OpenAPI({ summary: '获取量表列表' })
    async getAll(
        @QueryParam('type') type?: 'like' | 'talent',
        @QueryParam('direction') direction?: 'positive' | 'negative'
    ) {
        return await this.scaleService.findAll(type, direction);
    }

    @Get('/:id')
    @OpenAPI({ summary: '获取量表详情' })
    async getOne(@Param('id') id: number) {
        return await this.scaleService.findOne(id);
    }

    @Post('/:id/answers')
    @OpenAPI({ summary: '提交量表答案' })
    async submitAnswer(
        @Param('id') scaleId: number,
        @Body() data: { userId: number; score: number }
    ) {
        try {
            // 1. 检查是否存在答案
            const existingAnswer = await AppDataSource
                .getRepository(ScaleAnswer)
                .findOne({
                    where: {
                        scaleId: scaleId,
                        userId: data.userId
                    }
                });

            if (existingAnswer) {
                // 2. 如果存在则更新
                await AppDataSource
                    .getRepository(ScaleAnswer)
                    .update(
                        { id: existingAnswer.id },
                        { score: data.score }
                    );

                return {
                    success: true,
                    message: '答案已更新',
                    data: {
                        ...existingAnswer,
                        score: data.score
                    }
                };
            } else {
                // 3. 如果不存在则创建新答案
                const newAnswer = await AppDataSource
                    .getRepository(ScaleAnswer)
                    .save({
                        scaleId: scaleId,
                        userId: data.userId,
                        score: data.score
                    });

                return {
                    success: true,
                    message: '答案已保存',
                    data: newAnswer
                };
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            return {
                success: false,
                message: '保存答案失败',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    @Get('/answers/user/:userId')
    @OpenAPI({ summary: '获取用户的量表答案' })
    async getUserAnswers(@Param('userId') userId: number) {
        return await this.scaleService.getUserAnswers(userId);
    }

    @Get('/answers/user/:userId/summary')
    @OpenAPI({ summary: '获取用户量表答题汇总' })
    async getUserAnswersSummary(@Param('userId') userId: number) {
        return await this.scaleService.getUserAnswersSummary(userId);
    }
   
}