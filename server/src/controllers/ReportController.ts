import { getRepository } from 'typeorm';
import { ScaleAnswer } from '../entity/ScaleAnswer';
import { Request, Response } from 'express';

interface TalentAnalysisResult {
  dimension: string;
  hasTalent: boolean;
  hasInterest: boolean;
  score: number;
}

interface ReportContent {
  basicInfo: {
    userId: number;
    submittedAt: Date;
  };
  talentAnalysis: {
    categorizedResults: {
      bothTalentAndInterest: TalentAnalysisResult[];
      neitherTalentNorInterest: TalentAnalysisResult[];
      onlyInterest: TalentAnalysisResult[];
      onlyTalent: TalentAnalysisResult[];
    };
    radarData: {
      dimension: string;
      score: number;
    }[];
  };
}

export class ReportController {
  private calculateScore(
    talentPositive?: number,
    talentNegative?: number,
    likePositive?: number,
    likeNegative?: number
  ): number {
    const normalizeScore = (score?: number) => {
      if (!score) return 0;
      return ((4 - score) / 3) * 100;
    };
    
    const talentScore = (normalizeScore(talentPositive) + normalizeScore(talentNegative)) / 2;
    const interestScore = (normalizeScore(likePositive) + normalizeScore(likeNegative)) / 2;
    
    return (talentScore * 0.6 + interestScore * 0.4);
  }

  async getReport(req: Request, res: Response) {
    const { userId } = req.params;
    
    try {
      const scaleAnswerRepo = getRepository(ScaleAnswer);
      
      // 获取最新的答题记录
      const latestAnswer = await scaleAnswerRepo
        .createQueryBuilder('answer')
        .where('answer.userId = :userId', { userId })
        .orderBy('answer.submittedAt', 'DESC')
        .getOne();

      if (!latestAnswer) {
        return res.status(404).json({
          success: false,
          message: '未找到答题记录'
        });
      }

      // 获取天赋分析结果
      const talentAnalysis = await this.getTalentAnalysisData(userId);
      
      const reportContent: ReportContent = {
        basicInfo: {
          userId: Number(userId),
          submittedAt: latestAnswer.submittedAt
        },
        talentAnalysis: {
          categorizedResults: {
            bothTalentAndInterest: talentAnalysis.bothTalentAndInterest,
            neitherTalentNorInterest: talentAnalysis.neitherTalentNorInterest,
            onlyInterest: talentAnalysis.onlyInterest,
            onlyTalent: talentAnalysis.onlyTalent
          },
          radarData: talentAnalysis.rawAnalysis.map(item => ({
            dimension: item.dimension,
            score: item.score
          }))
        }
      };

      return res.json({
        success: true,
        data: reportContent
      });

    } catch (error) {
      console.error('Error getting report:', error);
      return res.status(500).json({
        success: false,
        message: '获取报告失败'
      });
    }
  }

  // 将原来的getTalentAnalysis方法重构为私有方法
  private async getTalentAnalysisData(userId: string | number) {
    const scaleAnswerRepo = getRepository(ScaleAnswer);
    
    const answers = await scaleAnswerRepo
      .createQueryBuilder('answer')
      .leftJoinAndSelect('answer.scale', 'scale')
      .where('answer.userId = :userId', { userId })
      .getMany();

    const dimensionMap = new Map<string, {
      talentPositive?: number;
      talentNegative?: number;
      likePositive?: number;
      likeNegative?: number;
    }>();

    answers.forEach(answer => {
      const dimension = answer.scale.dimension;
      const current = dimensionMap.get(dimension) || {};
      
      if (answer.scale.type === 'talent') {
        if (answer.scale.direction === 'positive') {
          current.talentPositive = answer.score;
        } else {
          current.talentNegative = answer.score;
        }
      } else { // type === 'like'
        if (answer.scale.direction === 'positive') {
          current.likePositive = answer.score;
        } else {
          current.likeNegative = answer.score;
        }
      }
      
      dimensionMap.set(dimension, current);
    });

    const analysis: TalentAnalysisResult[] = Array.from(dimensionMap.entries()).map(([dimension, scores]) => {
      const hasTalent = Boolean(scores.talentPositive && scores.talentNegative && 
        scores.talentPositive <= 2 && scores.talentNegative >= 3);
      
      const hasInterest = Boolean(scores.likePositive && scores.likeNegative && 
        scores.likePositive <= 2 && scores.likeNegative >= 3);
      
      const score = this.calculateScore(
        scores.talentPositive,
        scores.talentNegative,
        scores.likePositive,
        scores.likeNegative
      );

      return {
        dimension,
        hasTalent,
        hasInterest,
        score
      };
    });

    return {
      bothTalentAndInterest: analysis.filter(item => item.hasTalent && item.hasInterest),
      neitherTalentNorInterest: analysis.filter(item => !item.hasTalent && !item.hasInterest),
      onlyInterest: analysis.filter(item => !item.hasTalent && item.hasInterest),
      onlyTalent: analysis.filter(item => item.hasTalent && !item.hasInterest),
      rawAnalysis: analysis
    };
  }

  // 原来的getTalentAnalysis方法改为调用私有方法
  async getTalentAnalysis(req: Request, res: Response) {
    const { userId } = req.params;
    
    try {
      const analysis = await this.getTalentAnalysisData(userId);
      
      return res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error analyzing talent data:', error);
      return res.status(500).json({
        success: false,
        message: '分析天赋数据时发生错误'
      });
    }
  }
} 