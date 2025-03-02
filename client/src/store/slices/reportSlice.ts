import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ElementAnalysis {
  element_id: number;
  dimension: string;
  like_element: string;
  talent_element: string;
  category: '有喜欢有天赋' | '有喜欢没天赋' | '有天赋没喜欢' | '没喜欢没天赋' | '待确认';
  hasInterest: boolean | null;
  hasTalent: boolean | null;
  like_status: string;
  talent_status: string;
  status: string;
  like_element_id: number;
  talent_element_id: number;
  double_edged_id: number;
}

interface ReportState {
  dimensionScores: Record<string, number>;
  elementAnalysis: ElementAnalysis[];
}

const initialState: ReportState = {
  dimensionScores: {},
  elementAnalysis: []
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setDimensionScores: (state: ReportState, action: PayloadAction<Record<string, number>>) => {
      state.dimensionScores = action.payload;
    },
    setElementAnalysis: (state: ReportState, action: PayloadAction<ElementAnalysis[]>) => {
      state.elementAnalysis = action.payload;
    }
  }
});

export const { setDimensionScores, setElementAnalysis } = reportSlice.actions;
export default reportSlice.reducer;