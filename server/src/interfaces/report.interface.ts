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