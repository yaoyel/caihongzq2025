export interface TalentLikeAnalysisElement {
  elementId: number;
  name: string;
  dimension: string;
  score: number;
}

export interface TalentLikeAnalysisResult {
  bothTalentAndInterest: TalentLikeAnalysisElement[];
  neitherTalentNorInterest: TalentLikeAnalysisElement[];
  onlyInterest: TalentLikeAnalysisElement[];
  onlyTalent: TalentLikeAnalysisElement[];
  pending: TalentLikeAnalysisElement[];
}