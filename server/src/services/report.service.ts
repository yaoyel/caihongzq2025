import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { ScaleAnswerRepository } from '../repositories/scale-answer.repository';
import { TalentAnalysisResult, DimensionScores, ReportContent } from '../interfaces/report.interface';
import { logger } from '../config/logger';

@Service()
export class ReportService {
  constructor(
    @InjectRepository()
    private scaleAnswerRepository: ScaleAnswerRepository
  ) {}

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

  async getTalentAnalysis(userId: number) {
    try {
      const answers = await this.scaleAnswerRepository.findAllByUserIdWithScale(userId);
      const dimensionMap = new Map<string, DimensionScores>();

      answers.forEach(answer => {
        const dimension = answer.scale.dimension;
        const current = dimensionMap.get(dimension) || {};
        
        if (answer.scale.type === 'talent') {
          if (answer.scale.direction === 'positive') {
            current.talentPositive = answer.score;
          } else {
            current.talentNegative = answer.score;
          }
        } else {
          if (answer.scale.direction === 'positive') {
            current.likePositive = answer.score;
          } else {
            current.likeNegative = answer.score;
          }
        }
        
        dimensionMap.set(dimension, current);
      });

      const analysis: TalentAnalysisResult[] = Array.from(dimensionMap.entries())
        .map(([dimension, scores]) => ({
          dimension,
          hasTalent: Boolean(
            scores.talentPositive && 
            scores.talentNegative && 
            scores.talentPositive <= 2 && 
            scores.talentNegative >= 3
          ),
          hasInterest: Boolean(
            scores.likePositive && 
            scores.likeNegative && 
            scores.likePositive <= 2 && 
            scores.likeNegative >= 3
          ),
          score: this.calculateScore(
            scores.talentPositive,
            scores.talentNegative,
            scores.likePositive,
            scores.likeNegative
          )
        }));

      logger.info({ userId }, 'Talent analysis completed');
      return {
        bothTalentAndInterest: analysis.filter(item => item.hasTalent && item.hasInterest),
        neitherTalentNorInterest: analysis.filter(item => !item.hasTalent && !item.hasInterest),
        onlyInterest: analysis.filter(item => !item.hasTalent && item.hasInterest),
        onlyTalent: analysis.filter(item => item.hasTalent && !item.hasInterest),
        rawAnalysis: analysis
      };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get talent analysis');
      throw error;
    }
  }

  async getReport(userId: number): Promise<ReportContent> {
    try {
      const latestAnswer = await this.scaleAnswerRepository.findLatestByUserId(userId);

      if (!latestAnswer) {
        throw new Error('No answers found');
      }

      const talentAnalysis = await this.getTalentAnalysis(userId);
      
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

      logger.info({ userId }, 'Report generated successfully');
      return reportContent;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to generate report');
      throw error;
    }
  }
} 