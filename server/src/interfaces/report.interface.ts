// server/src/interfaces/report.interface.ts

export interface TalentAnalysisResult {
  dimension: string;
  hasTalent: boolean;
  hasInterest: boolean;
  score: number;
  elements: {
    talent: {
      positive: {
        elementId: number;
        name: string;
        score: number;
      };
      negative: {
        elementId: number;
        name: string;
        score: number;
      };
    };
    interest: {
      positive: {
        elementId: number;
        name: string;
        score: number;
      };
      negative: {
        elementId: number;
        name: string;
        score: number;
      };
    };
  };
}

export interface DimensionScores {
  talentPositive?: number;
  talentNegative?: number;
  likePositive?: number;
  likeNegative?: number;
}

export interface ReportContent {
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

/**
 * 168分析结果元素类型
 */
export interface Element168AnalysisResult {
  // 元素ID
  elementId: number;
  // 元素名称
  name: string;
  // 元素类型：喜欢或天赋
  type: 'like' | 'talent';
  // 维度
  dimension: '看' | '听' | '说' | '记' | '想' | '做' | '运动';
  // 得分
  score: number;
  // 分析结果: 明显、待发现、不明显
  result: '明显' | '待发现' | '不明显';
}

/**
 * 元素喜欢和天赋关系接口(原接口，保留向后兼容)
 */
export interface ElementLikeTalentRelation {
  // 元素ID（喜欢元素的ID）
  elementId: number;
  // 元素名称（喜欢元素的名称）
  name: string;
  // 维度
  dimension: '看' | '听' | '说' | '记' | '想' | '做' | '运动';
  // 喜欢分数
  likeScore: number;
  // 喜欢结果: 明显、待发现、不明显
  likeResult: '明显' | '待发现' | '不明显';
  // 喜欢元素的自然状态描述
  likeStateDescription?: string;
  // 双刃信息ID
  doubleEdgedId?: number;
  // 对应天赋元素ID
  talentElementId: number;
  // 对应天赋元素名称
  talentName: string;
  // 天赋分数
  talentScore: number;
  // 天赋结果: 明显、待发现、不明显
  talentResult: '明显' | '待发现' | '不明显';
  // 天赋元素的自然状态描述
  talentStateDescription?: string;
  // 关系类型
  relationType: '有喜欢有天赋' | '没喜欢没天赋' | '只喜欢' | '只天赋';
}

/**
 * 元素关系结果接口 (新接口，符合前端需求的格式)
 */
export interface ElementRelationResult {
  // 喜欢元素ID
  element_id: number;
  // 对应天赋元素ID
  corresponding_element_id: number;
  // 用户ID
  user_id: number;
  // 喜欢元素状态描述
  like_status: string;
  // 天赋元素状态描述
  talent_status: string;
  // 双刃信息ID
  double_edged_id: number | null;
  // 元素类型
  type: string;
  // 维度
  dimension: string;
  // 喜欢元素名称
  like_element: string;
  // 天赋元素名称
  talent_element: string;
  // 分类
  category: string;
}

/**
 * 元素分析接口
 */
export interface Element168Analysis {
  // 有喜欢有天赋的元素
  bothLikeAndTalent: ElementLikeTalentRelation[];
  // 没喜欢没天赋的元素
  neitherLikeNorTalent: ElementLikeTalentRelation[];
  // 有喜欢没天赋的元素
  onlyLike: ElementLikeTalentRelation[];
  // 有天赋没喜欢的元素
  onlyTalent: ElementLikeTalentRelation[];
}