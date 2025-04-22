import { Service } from 'typedi';
import { AppDataSource } from '../data-source';
import { QuestionAnswer } from '../entities/QuestionAnswer';
import { Element } from '../entities/Element';
import { ScaleAnswer } from '../entities/ScaleAnswer';
import { DoubleEdgedAnswer } from '../entities/DoubleEdgedAnswer';
import { Scale } from '../entities/Scale';
import { ScaleOption } from '../entities/ScaleOption';
import { DoubleEdgedInfo } from '../entities/DoubleEdgedInfo';
import { Question } from '../entities/Question';
import { DoubleEdgedScale, DoubleEdgedType } from '../entities/DoubleEdgedScale';
import { Brackets } from 'typeorm';

interface DoubleEdgedAnswerWithType {
  scaleContent: string;
  score: number;
  type: string;
  topic: string;
  scoreText: string;
}

interface ElementWithScales {
  id: number;
  name: string;
  type: 'like' | 'talent';
  dimension: string;
  ownedNaturalState: string;
  unownedNaturalState: string;
  attribute?: string;
  scales: {
    id: number;
    content: string;
    score: string;
  }[];
}

interface UserAnalysis {
  elements: ElementWithScales[];
  doubleEdgedElements: {
    likeElementId: number;
    talentElementId: number;
    name: string;
    demonstrate: string;
    affect: string;
  }[];
  questionAnswers: {
    question: string;
    answer: string;
  }[];
  doubleEdgedAnswers: DoubleEdgedAnswerWithType[];
}

@Service()
export class UserAnalysisService {
  private getTopicAndScoreText(type: DoubleEdgedType, score: number): { topic: string; scoreText: string } {
    const topics: Record<DoubleEdgedType, string> = {
      'inner_state': '您经常感受到下述哪种内在状态',
      'associate_with_people': '与人相处时，您经常感受到下述哪种内在状态？',
      'tackle_issues': '处理事情时，您经常感受到下述哪种内在状态？',
      'face_choices': '面对取舍时，您经常感受到下述哪种内在状态？',
      'common_outcome': '请感受一下，自己通常结果处于下述哪种状态？',
      'normal_state': '请感受一下，自己通常处于下述哪种状态总是?'
    };

    let scoreText = '';
    if ([1,2,3,4,5].includes(score)) {
      scoreText = ['总是', '经常', '很少', '从未', '没注意'][score - 1];
    } else if (score === 6) {
      scoreText = '"但"前符合，"但"后不符';
    } else if (score === 7) {
      scoreText = '从前经常，现在很少';
    }

    return {
      topic: topics[type] || '',
      scoreText: `${scoreText}（${score}分）`
    };
  }

  private getScaleScoreText(score: number): string {
    const scoreMap: Record<number, string> = {
      1: '非常符合',
      2: '比较符合',
      3: '一般',
      4: '不太符合',
      5: '完全不符合'
    };
    return `${scoreMap[score] || ''}（${score}分）`;
  }

  async getUserAnalysis(userId: number): Promise<UserAnalysis> {
    // 1. 获取所有元素信息（包含量表和分数）
    const elementsRaw = await AppDataSource
      .createQueryBuilder()
      .select([
        'e.id as id',
        'e.name as name',
        'e.type as type',
        'e.dimension as dimension',
        'e.status as status',
        's.content as scale_content',
        's.direction as scale_direction',
        'sa.score as scale_score'
      ])
      .from(Element, 'e')
      .leftJoin(Scale, 's', 's.element_id = e.id AND s.direction != \'168\'')
      .leftJoin(ScaleAnswer, 'sa', 'sa.scale_id = s.id  AND sa.user_id = :userId', { userId })
      .orderBy('e.id')
      .getRawMany();

    // 处理元素数据，按元素ID分组
    const elements = elementsRaw.reduce((acc, curr) => {
      const element = acc.find((e: any) => e.id === curr.id);
      if (!element) {
        acc.push({
          id: curr.id,
          name: curr.name,
          type: curr.type,
          dimension: curr.dimension,
          status: curr.status,
          scales: curr.scale_content ? [{
            content: curr.scale_content,
            direction: curr.scale_direction,
            score: curr.scale_score ? this.getScaleScoreText(curr.scale_score) : undefined
          }] : []
        });
      } else if (curr.scale_content) {
        element.scales.push({
          content: curr.scale_content,
          direction: curr.scale_direction,
          score: curr.scale_score ? this.getScaleScoreText(curr.scale_score) : undefined
        });
      }
      return acc;
    }, [] as ElementWithScales[]);

    // 3. 获取双刃剑元素
    const doubleEdgedElements = await AppDataSource
      .createQueryBuilder()
      .distinct()
      .select([
        'dei.like_element_id as likeElementId',
        'dei.talent_element_id as talentElementId',
        'dei.name as name',
        'dei.demonstrate as demonstrate',
        'dei.affect as affect'
      ])
      .from(DoubleEdgedInfo, 'dei')
      // 喜欢元素的正向量表答案
      .innerJoin(Scale, 's1_pos', 's1_pos.element_id = dei.like_element_id AND s1_pos.direction = :positive', 
        { positive: 'positive' })
      .innerJoin(ScaleAnswer, 'sa1_pos', 
        'sa1_pos.scale_id = s1_pos.id AND sa1_pos.user_id = :userId AND sa1_pos.score IN (1, 2)',
        { userId }
      )
      // 喜欢元素的反向量表答案
      .innerJoin(Scale, 's1_neg', 's1_neg.element_id = dei.like_element_id AND s1_neg.direction = :negative',
        { negative: 'negative' })
      .innerJoin(ScaleAnswer, 'sa1_neg',
        'sa1_neg.scale_id = s1_neg.id AND sa1_neg.user_id = :userId AND sa1_neg.score IN (3, 4)',
        { userId }
      )
      // 天赋元素的正向量表答案
      .innerJoin(Scale, 's2_pos', 's2_pos.element_id = dei.talent_element_id AND s2_pos.direction = :positive',
        { positive: 'positive' })
      .innerJoin(ScaleAnswer, 'sa2_pos',
        'sa2_pos.scale_id = s2_pos.id AND sa2_pos.user_id = :userId AND sa2_pos.score IN (1, 2)',
        { userId }
      )
      // 天赋元素的反向量表答案
      .innerJoin(Scale, 's2_neg', 's2_neg.element_id = dei.talent_element_id AND s2_neg.direction = :negative',
        { negative: 'negative' })
      .innerJoin(ScaleAnswer, 'sa2_neg',
        'sa2_neg.scale_id = s2_neg.id AND sa2_neg.user_id = :userId AND sa2_neg.score IN (3, 4)',
        { userId }
      )
      .getRawMany();

    // 4. 获取用户的问答记录
    const questionAnswers = await AppDataSource
      .createQueryBuilder()
      .select([
        'q.content as question',
        'qa.content as answer'
      ])
      .from(QuestionAnswer, 'qa')
      .innerJoin(Question, 'q', 'q.id = qa.question_id')
      .where('qa.user_id = :userId', { userId })
      .getRawMany();

    // 5. 获取用户的双刃剑量表答案
    const doubleEdgedAnswers = await AppDataSource
      .createQueryBuilder()
      .select([
        'des.content as scaleContent',
        'des.type as type',
        'dea.score as score',
        'dei.name as name',
        'dei.demonstrate as demonstrate',
        'dei.affect as affect'
      ])
      .from(DoubleEdgedAnswer, 'dea')
      .innerJoin(DoubleEdgedScale, 'des', 'des.id = dea.scale_id')
      .innerJoin(DoubleEdgedInfo, 'dei', 'dei.id = des.double_edged_id')
      .where('dea.user_id = :userId', { userId })
      .getRawMany();

    return {
      elements,
      doubleEdgedElements,
      questionAnswers,
      doubleEdgedAnswers: doubleEdgedAnswers.map(dea => {
        const { topic, scoreText } = this.getTopicAndScoreText(dea.type as DoubleEdgedType, dea.score);
        return {
          scaleContent: dea.scaleContent,
          score: dea.score,
          type: dea.type,
          topic,
          scoreText,
          name: dea.name,
          demonstrate: dea.demonstrate,
          affect: dea.affect
        };
      })
    };
  }

  async getUserAnalysis168(userId: number): Promise<UserAnalysis> {
    // 1. 获取所有元素信息（包含量表和分数）
    const elementsRaw = await AppDataSource
      .createQueryBuilder()
      .select([
        'e.id as id',
        'e.name as name',
        'e.type as type',
        'e.dimension as dimension',
        'e.owned_natural_state as owned_natural_state', 
        'e.unowned_natural_state as unowned_natural_state',
        's.id as scale_id',
        's.content as scale_content', 
        'sa.score as scale_score'
      ])
      .from(Element, 'e')
      .leftJoin(Scale, 's', 's.element_id = e.id AND s.direction = \'168\'')
      .leftJoin(ScaleAnswer, 'sa', 'sa.scale_id = s.id AND sa.user_id = :userId', { userId })
      .orderBy('e.id')
      .getRawMany();

    // 2. 获取所有用户的scale答案
    const userAnswers = await AppDataSource
      .createQueryBuilder()
      .select([
        'sa.scale_id as scaleId',
        'sa.score as score'
      ])
      .from(ScaleAnswer, 'sa')
      .where('sa.user_id = :userId', { userId })
      .getRawMany();

    // 3. 获取所有scale的options信息
    const scaleOptions = await AppDataSource
      .createQueryBuilder()
      .select('so')
      .from(ScaleOption, 'so')
      .orderBy('so.displayOrder')
      .getMany();

    // 4. 获取每个element的总得分
    const elementScores = await AppDataSource
      .createQueryBuilder()
      .select([
        's.element_id as elementId',
        'SUM(sa.score) as totalScore',
        'COUNT(sa.id) as count',
        's.direction as direction'
      ])
      .from(Scale, 's')
      .innerJoin(ScaleAnswer, 'sa', 'sa.scale_id = s.id AND s.direction=\'168\' AND sa.user_id = :userId', { userId })
      .groupBy('s.element_id, s.direction')
      .getRawMany();

    console.log(`元素得分: ${JSON.stringify(elementScores)}`); 
    
    // 处理元素数据，按元素ID分组
    const elements = elementsRaw.reduce((acc, curr) => {
      const element = acc.find((e: any) => e.id === curr.id);
      
      // 如果有score，找到对应的ScaleOption，否则显示"未填写"
      let scoreContent = "未填写";
      if (curr.scale_score !== null && curr.scale_score !== undefined) {
        const option = scaleOptions.find(
          opt => opt.scaleId === curr.scale_id && opt.optionValue === curr.scale_score
        );
        if (option) {
          scoreContent = option.optionName;
        }
      }
      
      // 获取该元素的总得分并判断属性
      const elementScore = elementScores.find(score => score.elementid === curr.id);
      let attribute = '未知';
      if (elementScore) {
        const totalScore =  elementScore.totalscore ;
        // 根据得分范围判断
        if (totalScore >= 4 && totalScore <= 6) {
          attribute = curr.type === 'like' ? '天生喜欢明显' : '先天禀赋明显';
        } else if (totalScore >= -3 && totalScore <= 3) {
          attribute = curr.type === 'like' ? '天生喜欢待发现' : '先天禀赋待发现';
        } else if (totalScore >= -6 && totalScore <= -4) {
          attribute = curr.type === 'like' ? '天生喜欢不明显' : '先天禀赋不明显';
        }
      }
      
      if (!element) {
        acc.push({
          id: curr.id,
          name: curr.name,
          type: curr.type,
          dimension: curr.dimension,
          ownedNaturalState: curr.owned_natural_state,
          unownedNaturalState: curr.unowned_natural_state,
          attribute: attribute,
          scales: curr.scale_content ? [{
            id: curr.scale_id,
            content: curr.scale_content,
            answer: scoreContent
          }] : []
        });
      } else if (curr.scale_content) {
        element.scales.push({
          id: curr.scale_id,
          content: curr.scale_content,
          answer: scoreContent
        });
      }
      return acc;
    }, [] as ElementWithScales[]);

    // 3. 获取双刃剑元素 - 基于scale答案总和在4-6分
    // 先获取所有可能的双刃剑元素信息
    const doubleEdgedInfos = await AppDataSource
      .createQueryBuilder()
      .select([
        'dei.id as id',
        'dei.like_element_id as likeElementId',
        'dei.talent_element_id as talentElementId',
        'dei.name as name',
        'dei.demonstrate as demonstrate',
        'dei.affect as affect'
      ])
      .from(DoubleEdgedInfo, 'dei')
      .getRawMany();

    console.log(`########################################################################`);
    console.log(`获取到的168用户scale得分: ${JSON.stringify(elementScores)}`);
    console.log(`双刃剑元素信息: ${JSON.stringify(doubleEdgedInfos)}`);

    // 筛选符合条件的双刃剑元素
    const doubleEdgedElements = doubleEdgedInfos.filter(dei => {
      // 获取喜欢元素的总分
      const likeElementScore = elementScores.find(score => score.elementid === dei.likeelementid);
      // 获取天赋元素的总分
      const talentElementScore = elementScores.find(score => score.elementid === dei.talentelementid);
      
      console.log(`检查双刃剑: ${dei.name}`);
      console.log(`- 喜欢元素ID ${dei.likeelementid}, 得分: ${likeElementScore ? JSON.stringify(likeElementScore) : '无'}`);
      console.log(`- 天赋元素ID ${dei.talentelementid}, 得分: ${talentElementScore ? JSON.stringify(talentElementScore) : '无'}`);
      
      // 如果任一元素没有得分数据，返回false
      if (!likeElementScore || !talentElementScore) {
        console.log(`- 结果: 缺少得分数据，不符合条件`);
        return false;
      }
      
      // 计算 总分 
      const likeTotalScore =  likeElementScore.totalscore;
      const talenTotalScore =  talentElementScore.totalscore ;
       
       
      const result = (likeTotalScore >= 4 && likeTotalScore <= 6) && 
                    (talenTotalScore >= 4 && talenTotalScore <= 6);
      
      console.log(`- 判定结果: ${result ? '符合条件' : '不符合条件'}`);  
      return result;
    }).map(dei => ({
      likeElementId: dei.likeelementid,
      talentElementId: dei.talentelementid,
      name: dei.name,
      demonstrate: dei.demonstrate,
      affect: dei.affect
    }));

    // 4. 获取用户的问答记录
    const questionAnswers = await AppDataSource
      .createQueryBuilder()
      .select([
        'q.content as question',
        'qa.content as answer'
      ])
      .from(QuestionAnswer, 'qa')
      .innerJoin(Question, 'q', 'q.id = qa.question_id')
      .where('qa.user_id = :userId', { userId })
      .getRawMany();

    // 5. 获取用户的双刃剑量表答案
    const doubleEdgedAnswers = await AppDataSource
      .createQueryBuilder()
      .select([
        'des.content as scaleContent',
        'des.type as type',
        'dea.score as score',
        'dei.name as name',
        'dei.demonstrate as demonstrate',
        'dei.affect as affect'
      ])
      .from(DoubleEdgedAnswer, 'dea')
      .innerJoin(DoubleEdgedScale, 'des', 'des.id = dea.scale_id')
      .innerJoin(DoubleEdgedInfo, 'dei', 'dei.id = des.double_edged_id')
      .where('dea.user_id = :userId', { userId })
      .getRawMany();

    return {
      elements,
      doubleEdgedElements,
      questionAnswers,
      doubleEdgedAnswers: doubleEdgedAnswers.map(dea => {
        const { topic, scoreText } = this.getTopicAndScoreText(dea.type as DoubleEdgedType, dea.score);
        return {
          scaleContent: dea.scaleContent,
          score: dea.score,
          type: dea.type,
          topic,
          scoreText,
          name: dea.name,
          demonstrate: dea.demonstrate,
          affect: dea.affect
        };
      })
    };
  }

  // 修改格式化提示词方法
  async formatAnalysisToPrompt(userId: number): Promise<{
    likeDefinition: string;
    talentDefinition: string;
    doubleEdgedDefinition: string;
    myLikeAndTalent: UserAnalysis;
  }> {
    const analysis = await this.getUserAnalysis168(userId);
    const likeDefinition='喜欢：热爱的种子，自发选择的方向，自觉投入的状态，与天赋相结合，能开心/自然而然做出更好的结果。';
    const talentDefinition='天赋：记忆中的闪光点，无师自通的规律发现，不学就会的行为走向，与喜欢相结合，能开心/自然而然的做出好结果。';
    const doubleEdgedDefinition='双刃剑：喜欢和天赋的结合，能开心/自然而然做出更好的结果。但也蕴含着反向的能量，需要平衡。';
    const myLikeAndTalent =  analysis 
    return  {
        likeDefinition,
        talentDefinition,
        doubleEdgedDefinition,
        myLikeAndTalent    
    } }
} 