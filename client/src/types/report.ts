export interface TalentAnalysisElement {
  elementId: number;
  name: string;
  score: number;
}

export interface TalentAnalysisElements {
  talent: {
    positive: TalentAnalysisElement;
    negative: TalentAnalysisElement;
  };
  interest: {
    positive: TalentAnalysisElement;
    negative: TalentAnalysisElement;
  };
}

export interface TalentAnalysis {
  dimension: string;
  hasTalent: boolean;
  hasInterest: boolean;
  score: number;
  elements: TalentAnalysisElements;
}

export interface TalentAnalysisData {
  categorizedResults: {
    bothTalentAndInterest: TalentAnalysis[];
    neitherTalentNorInterest: TalentAnalysis[];
    onlyInterest: TalentAnalysis[];
    onlyTalent: TalentAnalysis[];
  };
  radarData: {
    dimension: string;
    score: number;
  }[];
}