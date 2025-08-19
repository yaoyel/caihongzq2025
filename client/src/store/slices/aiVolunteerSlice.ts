import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

// 定义可见区域状态接口
interface VisibleRange {
  startIndex: number;
  endIndex: number;
  visibleItems: string[]; // 当前可见的项目ID列表
}

// 定义滚动状态接口
interface ScrollState {
  position: number;
  viewportHeight: number;
  documentHeight: number;
  isScrolling: boolean;
  lastScrollTime: number;
}

// 定义 AI 志愿页面状态接口
interface AiVolunteerState {
  // 滚动位置相关
  scrollPosition: number;
  displayCount: number;
  
  // 增强的滚动状态管理
  scrollState: ScrollState;
  visibleRange: VisibleRange;
  
  // 虚拟滚动相关
  itemHeight: number;
  containerHeight: number;
  
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
  
  // 缓存管理
  cachedScrollPositions: {
    [pageKey: string]: {
      scrollPosition: number;
      displayCount: number;
      visibleRange: VisibleRange;
      timestamp: number;
    };
  };
}

// 初始状态
const initialState: AiVolunteerState = {
  scrollPosition: 0,
  displayCount: 10,
  scrollState: {
    position: 0,
    viewportHeight: 0,
    documentHeight: 0,
    isScrolling: false,
    lastScrollTime: 0,
  },
  visibleRange: {
    startIndex: 0,
    endIndex: 0,
    visibleItems: [],
  },
  itemHeight: 200, // 每个项目的预估高度
  containerHeight: 0,
  sortTab: 'rankDiff',
  alternativeStatus: {},
  loading: true,
  loadingStatus: {},
  recommendCount: 0,
  alternatives: [],
  pageKey: '',
  isReturning: false,
  hasInitialized: false,
  cachedScrollPositions: {},
};

// 异步action creators
export const saveScrollPosition = createAsyncThunk(
  'aiVolunteer/saveScrollPosition',
  async (scrollData: { position: number; pageKey: string }) => {
    const { position, pageKey } = scrollData;
    
    // 保存到localStorage
    localStorage.setItem(`aiVolunteerScroll_${pageKey}`, JSON.stringify({
      position,
      timestamp: Date.now(),
    }));
    
    return { position, pageKey };
  }
);

export const restoreScrollPosition = createAsyncThunk(
  'aiVolunteer/restoreScrollPosition',
  async (pageKey: string) => {
    // 从localStorage恢复
    const savedData = localStorage.getItem(`aiVolunteerScroll_${pageKey}`);
    if (savedData) {
      const { position, timestamp } = JSON.parse(savedData);
      const isExpired = Date.now() - timestamp > 30 * 60 * 1000; // 30分钟过期
      
      if (!isExpired) {
        return { position, pageKey };
      }
    }
    
    return null;
  }
);

export const loadMoreItems = createAsyncThunk(
  'aiVolunteer/loadMoreItems',
  async (_, { getState }) => {
    const state = getState() as { aiVolunteer: AiVolunteerState };
    const currentCount = state.aiVolunteer.displayCount;
    
    // 模拟异步加载
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return currentCount + 10;
  }
);

// 创建 slice
const aiVolunteerSlice = createSlice({
  name: 'aiVolunteer',
  initialState,
  reducers: {
    // 设置滚动位置
    setScrollPosition: (state, action: PayloadAction<number>) => {
      state.scrollPosition = action.payload;
      state.scrollState.position = action.payload;
      state.scrollState.lastScrollTime = Date.now();
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
    
    // 更新可见区域
    updateVisibleRange: (state, action: PayloadAction<VisibleRange>) => {
      state.visibleRange = action.payload;
    },
    
    // 更新滚动状态
    updateScrollState: (state, action: PayloadAction<Partial<ScrollState>>) => {
      state.scrollState = { ...state.scrollState, ...action.payload };
    },
    
    // 设置容器高度
    setContainerHeight: (state, action: PayloadAction<number>) => {
      state.containerHeight = action.payload;
    },
    
    // 设置项目高度
    setItemHeight: (state, action: PayloadAction<number>) => {
      state.itemHeight = action.payload;
    },
    
    // 缓存滚动位置
    cacheScrollPosition: (state, action: PayloadAction<{
      pageKey: string;
      scrollPosition: number;
      displayCount: number;
      visibleRange: VisibleRange;
    }>) => {
      const { pageKey, scrollPosition, displayCount, visibleRange } = action.payload;
      state.cachedScrollPositions[pageKey] = {
        scrollPosition,
        displayCount,
        visibleRange,
        timestamp: Date.now(),
      };
    },
    
    // 清除缓存
    clearCache: (state, action: PayloadAction<string>) => {
      const pageKey = action.payload;
      delete state.cachedScrollPositions[pageKey];
      localStorage.removeItem(`aiVolunteerScroll_${pageKey}`);
    },
    
    // 重置状态（用于页面离开时）
    resetState: (state) => {
      state.scrollPosition = 0;
      state.displayCount = 10;
      state.scrollState = initialState.scrollState;
      state.visibleRange = initialState.visibleRange;
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
  
  // 处理异步action的extraReducers
  extraReducers: (builder) => {
    builder
      .addCase(saveScrollPosition.fulfilled, (state, action) => {
        const { position } = action.payload;
        state.scrollPosition = position;
        state.scrollState.position = position;
      })
      .addCase(restoreScrollPosition.fulfilled, (state, action) => {
        if (action.payload) {
          const { position } = action.payload;
          state.scrollPosition = position;
          state.scrollState.position = position;
        }
      })
      .addCase(loadMoreItems.fulfilled, (state, action) => {
        state.displayCount = action.payload;
      });
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
  updateVisibleRange,
  updateScrollState,
  setContainerHeight,
  setItemHeight,
  cacheScrollPosition,
  clearCache,
  resetState,
  restoreState,
} = aiVolunteerSlice.actions;

// 导出 reducer
export default aiVolunteerSlice.reducer;

// 选择器 (Selectors)
// 基础选择器
export const selectAiVolunteer = (state: { aiVolunteer: AiVolunteerState }) => state.aiVolunteer;

// 派生选择器
export const selectScrollPosition = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.scrollPosition
);

export const selectDisplayCount = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.displayCount
);

export const selectScrollState = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.scrollState
);

export const selectVisibleRange = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.visibleRange
);

export const selectAlternatives = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.alternatives
);

export const selectAlternativeStatus = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.alternativeStatus
);

export const selectLoading = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.loading
);

export const selectLoadingStatus = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.loadingStatus
);

export const selectSortTab = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.sortTab
);

export const selectRecommendCount = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.recommendCount
);

export const selectPageKey = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.pageKey
);

export const selectIsReturning = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.isReturning
);

export const selectHasInitialized = createSelector(
  [selectAiVolunteer],
  (aiVolunteer) => aiVolunteer.hasInitialized
);

// 计算选择器
export const selectTotalItems = createSelector(
  [selectAlternatives],
  (alternatives) => alternatives.reduce((total, group) => total + (group.result?.length || 0), 0)
);

export const selectIsNearBottom = createSelector(
  [selectScrollState, selectDisplayCount, selectTotalItems],
  (scrollState, displayCount, totalItems) => {
    return displayCount < totalItems && scrollState.position > 0;
  }
);

export const selectShouldLoadMore = createSelector(
  [selectScrollState, selectDisplayCount, selectTotalItems],
  (scrollState, displayCount, totalItems) => {
    const { position, viewportHeight, documentHeight } = scrollState;
    const isNearBottom = position + viewportHeight >= documentHeight - 200;
    return isNearBottom && displayCount < totalItems;
  }
);

export const selectCachedScrollPosition = createSelector(
  [selectAiVolunteer, (_state, pageKey: string) => pageKey],
  (aiVolunteer, pageKey) => aiVolunteer.cachedScrollPositions[pageKey]
);

// 导出类型
export type { AiVolunteerState, ScrollState, VisibleRange }; 