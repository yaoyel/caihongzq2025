import { JsonController, Get, Param } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Service } from 'typedi';
import { ReportService } from '../services/report.service';
import { logger } from '../config/logger';

@JsonController('/report')
@Service()
export class ReportController {
    constructor(private reportService: ReportService) {}

    @Get('/detail/:userId')
    @OpenAPI({ summary: '获取用户报告详情' })
    async getReport(@Param('userId') userId: number) {
        try {
            return await this.reportService.getReport(userId);
        } catch (error) {
            logger.error({ userId, error }, 'Failed to get report');
            throw error;
        }
    }

    @Get('/talent-analysis/:userId')
    @OpenAPI({ summary: '获取用户天赋分析' })
    async getTalentAnalysis(@Param('userId') userId: number) {
        try {
            return await this.reportService.getTalentAnalysis(userId);
        } catch (error) {
            logger.error({ userId, error }, 'Failed to get talent analysis');
            throw error;
        }
    }
} 