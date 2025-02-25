import { JsonController, Get, Param, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { UserAnalysisService } from '../services/userAnalysis.service';

@JsonController('/user-analysis')
@Service()
export class UserAnalysisController {
    constructor(private userAnalysisService: UserAnalysisService) {}

    @Get('/:userId')
    @OpenAPI({ 
        summary: '获取用户的综合分析数据',
        description: '获取用户的问答记录、元素评分和双刃剑答案等综合数据'
    }) 
    async getUserAnalysis(@Param('userId') userId: number) {
        try {
            const analysis = await this.userAnalysisService.getUserAnalysis(userId);
            return {
                success: true,
                data: analysis
            };
        } catch (error) {
            return {
                success: false,
                error: '获取用户分析数据失败',
                details: error instanceof Error ? error.message : String(error)
            };
        }
    }

    @Get('/:userId/prompt')
    @OpenAPI({ 
        summary: '获取用户分析提示词',
        description: '获取格式化后的用户分析提示词，用于AI对话'
    }) 
    async getUserAnalysisPrompt(@Param('userId') userId: number) {
        try {
            
            const prompt = this.userAnalysisService.formatAnalysisToPrompt(userId);
            return {
                success: true,
                data: prompt
            };
        } catch (error) {
            return {
                success: false,
                error: '获取用户分析提示词失败',
                details: error instanceof Error ? error.message : String(error)
            };
        }
    }
} 