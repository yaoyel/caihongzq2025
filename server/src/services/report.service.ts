import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';
import { ScaleAnswer } from '../entities/ScaleAnswer';
import { TalentAnalysisResult, DimensionScores, ReportContent } from '../interfaces/report.interface';
import { AppDataSource } from '../data-source';
import { ReportRepository } from '../repositories/report.repository';

@Service()
export class ReportService {
  private scaleAnswerRepository: Repository<ScaleAnswer>;
  constructor(
    private reportRepository: ReportRepository
  ) {
    this.scaleAnswerRepository = AppDataSource.getRepository(ScaleAnswer);
  }
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
  async getElementAnalysis(userId: number) {
    return await this.reportRepository.getElementAnalysis(userId);
  }

  async getTalentAnalysis(userId: number) {
    try {
      const answers = await this.scaleAnswerRepository.find({
        where: { userId },
        relations: ['scale', 'scale.element']
      });
      const dimensionMap = new Map<string, DimensionScores & {
        talentPositiveElement?: { id: number; name: string; score: number };
        talentNegativeElement?: { id: number; name: string; score: number };
        likePositiveElement?: { id: number; name: string; score: number };
        likeNegativeElement?: { id: number; name: string; score: number };
      }>();

      answers.forEach(answer => {
        const dimension = answer.scale.dimension;
        const current = dimensionMap.get(dimension) || {};
        
        if (answer.scale.type === 'talent') {
          if (answer.scale.direction === 'positive') {
            current.talentPositive = answer.score;
            current.talentPositiveElement = {
              id: answer.scale.element.id,
              name: answer.scale.element.name,
              score: answer.score
            };
          } else {
            current.talentNegative = answer.score;
            current.talentNegativeElement = {
              id: answer.scale.element.id,
              name: answer.scale.element.name,
              score: answer.score
            };
          }
        } else {
          if (answer.scale.direction === 'positive') {
            current.likePositive = answer.score;
            current.likePositiveElement = {
              id: answer.scale.element.id,
              name: answer.scale.element.name,
              score: answer.score
            };
          } else {
            current.likeNegative = answer.score;
            current.likeNegativeElement = {
              id: answer.scale.element.id,
              name: answer.scale.element.name,
              score: answer.score
            };
          }
        }
        
        dimensionMap.set(dimension, current);
      });
      const analysis: TalentAnalysisResult[] = Array.from(dimensionMap.entries()).map(([dimension, scores]) => ({
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
        ),
        elements: {
          talent: {
            positive: scores.talentPositiveElement ? 
              { elementId: scores.talentPositiveElement.id, name: scores.talentPositiveElement.name, score: scores.talentPositiveElement.score } :
              { elementId: 0, name: '', score: 0 },
            negative: scores.talentNegativeElement ?
              { elementId: scores.talentNegativeElement.id, name: scores.talentNegativeElement.name, score: scores.talentNegativeElement.score } :
              { elementId: 0, name: '', score: 0 }
          },
          interest: {
            positive: scores.likePositiveElement ?
              { elementId: scores.likePositiveElement.id, name: scores.likePositiveElement.name, score: scores.likePositiveElement.score } :
              { elementId: 0, name: '', score: 0 },
            negative: scores.likeNegativeElement ?
              { elementId: scores.likeNegativeElement.id, name: scores.likeNegativeElement.name, score: scores.likeNegativeElement.score } :
              { elementId: 0, name: '', score: 0 }
          }
        }
      }));
      return {
        bothTalentAndInterest: analysis.filter(item => item.hasTalent && item.hasInterest),
        neitherTalentNorInterest: analysis.filter(item => !item.hasTalent && !item.hasInterest),
        onlyInterest: analysis.filter(item => !item.hasTalent && item.hasInterest),
        onlyTalent: analysis.filter(item => item.hasTalent && !item.hasInterest),
        rawAnalysis: analysis
      };
    } catch (error) {
      throw error;
    }
  }
   
  async getReport(userId: number): Promise<ReportContent> {
    try {
      const latestAnswer = await this.scaleAnswerRepository.findOne({
        where: { userId },
        order: { submittedAt: 'DESC' }
      });

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

      return reportContent;
    } catch (error) {
      throw error;
    }
  }
}