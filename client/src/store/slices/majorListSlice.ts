import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义tab状态的接口
interface MajorListState {
  // 主选项卡状态
  activeTab: 'development' | 'passion' | 'opportunity';
  // 热爱能量子选项卡状态
  activeSubTab: 'le' | 'shan' | 'yan' | 'zu' | undefined;
  // 机遇指数子选项卡状态
  activeOpportunitySubTab: 'academic' | 'career' | 'industry' | 'growth' | undefined;
}

// 初始状态
const initialState: MajorListState = {
  activeTab: 'development',
  activeSubTab: undefined,
  activeOpportunitySubTab: undefined,
};

// 创建slice
const majorListSlice = createSlice({
  name: 'majorList',
  initialState,
  reducers: {
    // 设置主选项卡
    setActiveTab: (state, action: PayloadAction<'development' | 'passion' | 'opportunity'>) => {
      state.activeTab = action.payload;
      // 切换主选项卡时重置子选项卡状态
      state.activeSubTab = undefined;
      state.activeOpportunitySubTab = undefined;
    },
    // 设置热爱能量子选项卡
    setActiveSubTab: (state, action: PayloadAction<'le' | 'shan' | 'yan' | 'zu' | undefined>) => {
      state.activeSubTab = action.payload;
    },
    // 设置机遇指数子选项卡
    setActiveOpportunitySubTab: (
      state,
      action: PayloadAction<'academic' | 'career' | 'industry' | 'growth' | undefined>
    ) => {
      state.activeOpportunitySubTab = action.payload;
    },
    // 重置所有tab状态
    resetTabState: (state) => {
      state.activeTab = 'development';
      state.activeSubTab = undefined;
      state.activeOpportunitySubTab = undefined;
    },
  },
});

// 导出actions
export const { setActiveTab, setActiveSubTab, setActiveOpportunitySubTab, resetTabState } =
  majorListSlice.actions;

// 导出reducer
export default majorListSlice.reducer; 