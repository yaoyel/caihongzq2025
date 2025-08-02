import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义 AI 志愿页面状态接口
interface AiVolunteerState {
  // 滚动位置相关
  scrollPosition: number;
  displayCount: number;
  
  // 排序和筛选相关
  sortTab: 'willingness' | 'major' | 'rankDiff';
  
  // 备选状态管理
  alternativeStatus: {
    [key: string]: { isAlternative: boolean; id?: string };
  };
  
  // 加载状态
  loading: boolean;
  loadingStatus: { [key: string]: boolean };
  
  // 推荐数量
  recommendCount: number;
  
  // 数据缓存
  alternatives: any[];
  
  // 页面标识，用于判断是否需要恢复状态
  pageKey: string;
  
  // 页面状态管理
  isReturning: boolean; // 是否是从返回操作进入的页面
  hasInitialized: boolean; // 是否已经初始化过
}

// 初始状态
const initialState: AiVolunteerState = {
  scrollPosition: 0,
  displayCount: 10,
  sortTab: 'rankDiff',
  alternativeStatus: {},
  loading: true,
  loadingStatus: {},
  recommendCount: 0,
  alternatives: [],
  pageKey: '',
  isReturning: false,
  hasInitialized: false,
};

// 创建 slice
const aiVolunteerSlice = createSlice({
  name: 'aiVolunteer',
  initialState,
  reducers: {
    // 设置滚动位置
    setScrollPosition: (state, action: PayloadAction<number>) => {
      state.scrollPosition = action.payload;
    },
    
    // 设置显示数量
    setDisplayCount: (state, action: PayloadAction<number>) => {
      state.displayCount = action.payload;
    },
    
    // 设置排序方式
    setSortTab: (state, action: PayloadAction<'willingness' | 'major' | 'rankDiff'>) => {
      state.sortTab = action.payload;
    },
    
    // 设置备选状态
    setAlternativeStatus: (state, action: PayloadAction<{
      [key: string]: { isAlternative: boolean; id?: string };
    }>) => {
      state.alternativeStatus = action.payload;
    },
    
    // 更新单个备选状态
    updateAlternativeStatus: (state, action: PayloadAction<{
      key: string;
      status: { isAlternative: boolean; id?: string };
    }>) => {
      const { key, status } = action.payload;
      state.alternativeStatus[key] = status;
    },
    
    // 设置加载状态
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // 设置按钮加载状态
    setLoadingStatus: (state, action: PayloadAction<{ [key: string]: boolean }>) => {
      state.loadingStatus = action.payload;
    },
    
    // 更新单个按钮加载状态
    updateLoadingStatus: (state, action: PayloadAction<{
      key: string;
      loading: boolean;
    }>) => {
      const { key, loading } = action.payload;
      state.loadingStatus[key] = loading;
    },
    
    // 设置推荐数量
    setRecommendCount: (state, action: PayloadAction<number>) => {
      state.recommendCount = action.payload;
    },
    
    // 设置备选志愿数据
    setAlternatives: (state, action: PayloadAction<any[]>) => {
      state.alternatives = action.payload;
    },
    
    // 设置页面标识
    setPageKey: (state, action: PayloadAction<string>) => {
      state.pageKey = action.payload;
    },
    
    // 设置返回状态
    setIsReturning: (state, action: PayloadAction<boolean>) => {
      state.isReturning = action.payload;
    },
    
    // 设置初始化状态
    setHasInitialized: (state, action: PayloadAction<boolean>) => {
      state.hasInitialized = action.payload;
    },
    
    // 重置状态（用于页面离开时）
    resetState: (state) => {
      state.scrollPosition = 0;
      state.displayCount = 10;
      state.loading = true;
      state.loadingStatus = {};
      state.alternatives = [];
      state.pageKey = '';
      state.isReturning = false;
      state.hasInitialized = false;
    },
    
    // 恢复状态（用于页面返回时）
    restoreState: (state, action: PayloadAction<Partial<AiVolunteerState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

// 导出 actions
export const {
  setScrollPosition,
  setDisplayCount,
  setSortTab,
  setAlternativeStatus,
  updateAlternativeStatus,
  setLoading,
  setLoadingStatus,
  updateLoadingStatus,
  setRecommendCount,
  setAlternatives,
  setPageKey,
  setIsReturning,
  setHasInitialized,
  resetState,
  restoreState,
} = aiVolunteerSlice.actions;

// 导出 reducer
export default aiVolunteerSlice.reducer; 