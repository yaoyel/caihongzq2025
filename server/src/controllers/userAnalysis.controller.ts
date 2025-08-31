import { JsonController, Get, Param, Authorized } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { UserAnalysisService } from '../services/userAnalysis.service';
import { UserService } from '../services/user.service';
import { MajorScoreService } from '../services/major.service';
import { MajorRedisService } from '../services/major.redis.service';

@JsonController('/user-analysis')
@Service()
export class UserAnalysisController {
    constructor(private userAnalysisService: UserAnalysisService,private userService: UserService,private majorService: MajorScoreService,private majorRedisService: MajorRedisService,private majorScoreService: MajorScoreService) {}

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
            
            const prompt = await this.userAnalysisService.formatAnalysisToPrompt(userId);
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

    @Get('/:userId/prompt/all')
    @OpenAPI({ 
        summary: '获取用户分析提示词',
        description: '获取格式化后的用户分析提示词，用于AI对话'
    }) 
    async getUserAnalysisPromptAll(@Param('userId') userId: number) {
        try {
            
            const prompt = await this.userAnalysisService.formatAnalysisToPrompt(userId);
            const user = await this.userService.findOne(userId);
            const userScore = await this.majorService.calculateMajorScoresWithAll(userId.toString(),user!.enrollType || "本科批");

            const {province, preferredSubjects, secondarySubjects,enrollType} = user!; 
            const firstSubject = preferredSubjects || '综合';      
            // 获取选科匹配的专业代码列表
            const secondSubjectsArray = (secondarySubjects || '').split(',').filter(Boolean);
            const matchingMajorCodes = await this.majorRedisService.getMatchingStats(
              province || '北京',
              firstSubject,
              secondSubjectsArray
            );
      
      
            // 创建匹配专业代码的Set，用于快速查找
            const matchingMajorCodeSet = new Set(matchingMajorCodes);
      
     
            // 为每个专业添加匹配标记
            const scoresWithMatchingFlag = userScore.map(score => ({
              ...score,
              isMatching: matchingMajorCodeSet.has(score.majorCode) 
            }));

            return {
                success: true,
                data: {
                    prompt: prompt,
                    userScore: scoresWithMatchingFlag
                }
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