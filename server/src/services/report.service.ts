import { Service } from 'typedi'; 
import { Repository } from 'typeorm';
import { ScaleAnswer } from '../entities/ScaleAnswer';
import { TalentAnalysisResult, DimensionScores, ReportContent, Element168AnalysisResult, Element168Analysis, ElementLikeTalentRelation, ElementRelationResult } from '../interfaces/report.interface';
import { AppDataSource } from '../data-source';
import { ReportRepository } from '../repositories/report.repository';
import { Scale } from '../entities/Scale';
import { Element } from '../entities/Element';

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
 
/**
 * 获取用户基于168问题的元素分析
 * @param userId 用户ID
 * @returns 元素分析结果：包含所有元素关系的数组
 */
async getElementAnalysis168(userId: number): Promise<ElementRelationResult[]> {
  try {
    // 创建Element的仓库
    const elementRepository = AppDataSource.getRepository(Element);
    
    // 获取所有元素信息，包括对应元素关系和双刃信息
    const allElements = await elementRepository.find({
      relations: ['correspondingElement', 'doubleEdgedInfo']
    });
    
    // 获取用户所有问题答案及关联数据
    const answers = await this.scaleAnswerRepository.find({
      where: { userId },
      relations: ['scale', 'scale.element']
    });
    
    // 筛选出168方向的答案
    const answers168 = answers.filter(answer => answer.scale.direction === '168');
    
    if (!answers168.length) {
      throw new Error('没有找到用户的168问题答案');
    }
    
    // 按元素ID分组，合计每个元素的所有scale分数
    const elementScoresMap = new Map<number, { 
      element: Element,
      totalScore: number, 
      scaleCount: number 
    }>();
    
    // 初始化所有元素的得分为0
    allElements.forEach(element => {
      elementScoresMap.set(element.id, {
        element,
        totalScore: 0,
        scaleCount: 0
      });
    });
    
    // 遍历所有答案，计算每个元素的总分数
    for (const answer of answers168) {
      const element = answer.scale.element;
      if (!element) continue;
      
      const current = elementScoresMap.get(element.id);
      if (current) {
        // 累加分数并增加计数
        current.totalScore += answer.score;
        current.scaleCount += 1;
        elementScoresMap.set(element.id, current);
      }
    }
    
    // 计算每个元素的得分结果
    const resultsMap = new Map<number, { 
      element: Element, 
      score: number, 
      result: '明显' | '待发现' | '不明显' 
    }>();
    
    // 处理每个元素的分析结果
    for (const [elementId, data] of elementScoresMap.entries()) {
      // 根据总分判断结果类别
      let result: '明显' | '待发现' | '不明显';
      const totalScore = data.totalScore;
      
      if (totalScore >= 4 && totalScore <= 6) {
        result = '明显';
      } else if (totalScore >= -3 && totalScore <= 3) {
        result = '待发现';
      } else if (totalScore >= -6 && totalScore <= -4) {
        result = '不明显';
      } else {
        // 如果得分超出范围，默认为待发现
        result = '待发现';
      }
      
      // 保存分析结果
      resultsMap.set(elementId, {
        element: data.element,
        score: totalScore,
        result
      });
    }
    
    // 存储所有的元素关系结果
    const elementRelations: ElementRelationResult[] = [];
    
    // 分析喜欢元素与对应天赋元素的关系
    const likeElements = allElements.filter(e => e.type === 'like' && e.correspondingElementId);
    
    likeElements.forEach(likeElement => {
      // 获取喜欢元素的分析结果
      const likeAnalysis = resultsMap.get(likeElement.id);
      if (!likeAnalysis) return;
      
      // 获取对应天赋元素的分析结果
      const correspondingElement = likeElement.correspondingElement;
      if (!correspondingElement) return;
      
      const talentAnalysis = resultsMap.get(correspondingElement.id);
      if (!talentAnalysis) return;
      
      // 判断是否有喜欢/有天赋
      const hasLike = likeAnalysis.result === '明显';
      const hasTalent = talentAnalysis.result === '明显';
      
      // 获取对应的自然状态描述
      const likeStateDescription = hasLike ? 
        likeElement.ownedNaturalState : 
        likeElement.unownedNaturalState;
      
      const talentStateDescription = hasTalent ? 
        correspondingElement.ownedNaturalState : 
        correspondingElement.unownedNaturalState;
      
      // 确定关系类型
      let category: string = '没喜欢没天赋';
      if (hasLike && hasTalent) {
        category = '有喜欢有天赋';
      } else if (hasLike && !hasTalent) {
        category = '有喜欢没天赋';
      } else if (!hasLike && hasTalent) {
        category = '有天赋没喜欢';
      }
      
      // 创建关系对象，使用新的结构
      const relation: ElementRelationResult = {
        element_id: likeElement.id,
        corresponding_element_id: correspondingElement.id,
        user_id: userId,
        like_status: likeStateDescription || '',
        talent_status: talentStateDescription || '',
        double_edged_id: likeElement.doubleEdgedId,
        type: likeElement.type,
        dimension: likeElement.dimension,
        like_element: likeElement.name,
        talent_element: correspondingElement.name,
        category: category
      };
      
      // 将关系对象添加到结果数组中
      elementRelations.push(relation);
    });
    
    // 直接返回所有元素关系的数组
    return elementRelations;
  } catch (error) {
    throw error;
  }
}
}