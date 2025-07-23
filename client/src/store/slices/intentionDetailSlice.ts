import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义意向专业详情页面状态的接口
interface IntentionDetailState {
  // 位次段展开状态
  expandedGroups: { [key: number]: boolean };
  // 滚动位置记录
  scrollPositions: { [key: string]: number };
  // 当前专业代码
  currentMajorCode: string | null;
  // 当前位次段
  currentGroupNum: number | null;
  // 搜索关键词
  searchKeyword: string;
  // 备选状态
  alternativeStatus: { [key: string]: { isAlternative: boolean; id?: string } };
  // 加载状态
  loadingStatus: { [key: string]: boolean };
}

// 初始状态
const initialState: IntentionDetailState = {
  expandedGroups: {},
  scrollPositions: {},
  currentMajorCode: null,
  currentGroupNum: null,
  searchKeyword: '',
  alternativeStatus: {},
  loadingStatus: {},
};

// 创建slice
const intentionDetailSlice = createSlice({
  name: 'intentionDetail',
  initialState,
  reducers: {
    // 设置位次段展开状态
    setExpandedGroups: (state, action: PayloadAction<{ [key: number]: boolean }>) => {
      state.expandedGroups = action.payload;
    },
    
    // 切换单个位次段展开状态
    toggleGroupExpansion: (state, action: PayloadAction<number>) => {
      const groupNum = action.payload;
      state.expandedGroups[groupNum] = !state.expandedGroups[groupNum];
    },
    
    // 设置所有位次段展开状态
    setAllGroupsExpanded: (state, action: PayloadAction<boolean>) => {
      const isExpanded = action.payload;
      state.expandedGroups = {
        0: isExpanded,
        1: isExpanded,
        2: isExpanded,
        3: isExpanded,
      };
    },
    
    // 保存滚动位置
    saveScrollPosition: (state, action: PayloadAction<{ key: string; position: number }>) => {
      const { key, position } = action.payload;
      state.scrollPositions[key] = position;
    },
    

    
    // 设置当前专业信息
    setCurrentMajorInfo: (state, action: PayloadAction<{ majorCode: string; groupNum: number }>) => {
      const { majorCode, groupNum } = action.payload;
      state.currentMajorCode = majorCode;
      state.currentGroupNum = groupNum;
    },
    
    // 设置搜索关键词
    setSearchKeyword: (state, action: PayloadAction<string>) => {
      state.searchKeyword = action.payload;
    },
    
    // 设置备选状态
    setAlternativeStatus: (state, action: PayloadAction<{ [key: string]: { isAlternative: boolean; id?: string } }>) => {
      state.alternativeStatus = action.payload;
    },
    
    // 更新单个备选状态
    updateAlternativeStatus: (state, action: PayloadAction<{ key: string; status: { isAlternative: boolean; id?: string } }>) => {
      const { key, status } = action.payload;
      state.alternativeStatus[key] = status;
    },
    
    // 设置加载状态
    setLoadingStatus: (state, action: PayloadAction<{ [key: string]: boolean }>) => {
      state.loadingStatus = action.payload;
    },
    
    // 更新单个加载状态
    updateLoadingStatus: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loadingStatus[key] = loading;
    },
    
    // 重置状态
    resetIntentionDetailState: (state) => {
      state.expandedGroups = {};
      state.scrollPositions = {};
      state.currentMajorCode = null;
      state.currentGroupNum = null;
      state.searchKeyword = '';
      state.alternativeStatus = {};
      state.loadingStatus = {};
    },
    
    // 清除特定专业的滚动位置
    clearScrollPosition: (state, action: PayloadAction<string>) => {
      delete state.scrollPositions[action.payload];
    },
  },
});

// 导出actions
export const {
  setExpandedGroups,
  toggleGroupExpansion,
  setAllGroupsExpanded,
  saveScrollPosition,
  setCurrentMajorInfo,
  setSearchKeyword,
  setAlternativeStatus,
  updateAlternativeStatus,
  setLoadingStatus,
  updateLoadingStatus,
  resetIntentionDetailState,
  clearScrollPosition,
} = intentionDetailSlice.actions;

// 导出reducer
export default intentionDetailSlice.reducer; 