import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  setScrollPosition,
  updateScrollState,
  updateVisibleRange,
  cacheScrollPosition,
  selectScrollPosition,
  selectScrollState,
  selectVisibleRange,
  selectPageKey,
  selectDisplayCount,
  selectAlternatives,
} from '../store/slices/aiVolunteerSlice';

// 滚动管理hook的配置选项
interface ScrollManagerOptions {
  pageKey: string;
  itemHeight?: number;
  bufferSize?: number; // 缓冲区大小，用于虚拟滚动
  throttleDelay?: number; // 节流延迟
  enableVirtualScroll?: boolean; // 是否启用虚拟滚动
}

// 可见区域计算结果
interface VisibleRangeResult {
  startIndex: number;
  endIndex: number;
  visibleItems: string[];
  offsetY: number;
}

export const useScrollManager = (options: ScrollManagerOptions) => {
  const {
    pageKey,
    itemHeight = 200,
    bufferSize = 5,
    throttleDelay = 100,
    enableVirtualScroll = true,
  } = options;

  const dispatch = useDispatch<AppDispatch>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();
  const isRestoringRef = useRef(false);

  // 从Redux获取状态
  const scrollPosition = useSelector(selectScrollPosition);
  const scrollState = useSelector(selectScrollState);
  const visibleRange = useSelector(selectVisibleRange);
  const currentPageKey = useSelector(selectPageKey);
  const displayCount = useSelector(selectDisplayCount);
  const alternatives = useSelector(selectAlternatives);

  // 计算可见区域
  const calculateVisibleRange = useCallback(
    (scrollTop: number, containerHeight: number): VisibleRangeResult => {
      if (!enableVirtualScroll) {
        return {
          startIndex: 0,
          endIndex: alternatives.length - 1,
          visibleItems: alternatives.map((_, index) => `item-${index}`),
          offsetY: 0,
        };
      }

      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
      const endIndex = Math.min(
        alternatives.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
      );

      const visibleItems = [];
      for (let i = startIndex; i <= endIndex; i++) {
        if (alternatives[i]) {
          visibleItems.push(`item-${i}`);
        }
      }

      return {
        startIndex,
        endIndex,
        visibleItems,
        offsetY: startIndex * itemHeight,
      };
    },
    [alternatives, itemHeight, bufferSize, enableVirtualScroll]
  );

  // 保存滚动位置到localStorage
  const saveScrollPositionToStorage = useCallback((position: number) => {
    localStorage.setItem(`aiVolunteerScroll_${pageKey}`, JSON.stringify({
      position,
      timestamp: Date.now(),
    }));
  }, [pageKey]);

  // 从localStorage恢复滚动位置
  const restoreScrollPositionFromStorage = useCallback(() => {
    const savedData = localStorage.getItem(`aiVolunteerScroll_${pageKey}`);
    if (savedData) {
      const { position, timestamp } = JSON.parse(savedData);
      const isExpired = Date.now() - timestamp > 30 * 60 * 1000; // 30分钟过期
      
      if (!isExpired) {
        return position;
      }
    }
    return null;
  }, [pageKey]);

  // 节流处理滚动事件
  const throttledScrollHandler = useCallback(
    (scrollTop: number) => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }

      throttleTimeoutRef.current = setTimeout(() => {
        if (!isRestoringRef.current) {
          // 更新滚动状态
          dispatch(setScrollPosition(scrollTop));
          
          // 更新可见区域
          const containerHeight = scrollContainerRef.current?.clientHeight || window.innerHeight;
          const visibleRangeResult = calculateVisibleRange(scrollTop, containerHeight);
          
          dispatch(updateVisibleRange({
            startIndex: visibleRangeResult.startIndex,
            endIndex: visibleRangeResult.endIndex,
            visibleItems: visibleRangeResult.visibleItems,
          }));

          // 更新滚动状态
          dispatch(updateScrollState({
            position: scrollTop,
            viewportHeight: containerHeight,
            documentHeight: document.documentElement.scrollHeight,
            isScrolling: false,
            lastScrollTime: Date.now(),
          }));

          // 缓存滚动位置
          dispatch(cacheScrollPosition({
            pageKey,
            scrollPosition: scrollTop,
            displayCount,
            visibleRange: {
              startIndex: visibleRangeResult.startIndex,
              endIndex: visibleRangeResult.endIndex,
              visibleItems: visibleRangeResult.visibleItems,
            },
          }));

          // 保存到localStorage
          saveScrollPositionToStorage(scrollTop);
        }
      }, throttleDelay);
    },
    [dispatch, pageKey, displayCount, calculateVisibleRange, throttleDelay, saveScrollPositionToStorage]
  );

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (isRestoringRef.current) return;

    // 使用window滚动
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // 立即更新滚动状态为正在滚动
    dispatch(updateScrollState({ isScrolling: true }));
    
    // 节流处理
    throttledScrollHandler(scrollTop);
  }, [dispatch, throttledScrollHandler]);

  // 恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    if (currentPageKey !== pageKey) return;

    try {
      isRestoringRef.current = true;
      
      const position = restoreScrollPositionFromStorage();
      
      if (position !== null) {
        // 确保有足够的数据显示
        const estimatedItemsNeeded = Math.ceil(position / itemHeight) + bufferSize;
        const requiredItems = Math.max(estimatedItemsNeeded, displayCount);
        
        if (requiredItems > displayCount) {
          // 等待数据加载完成后再恢复滚动位置
          setTimeout(() => {
            requestAnimationFrame(() => {
              window.scrollTo(0, position);
              isRestoringRef.current = false;
            });
          }, 300);
        } else {
          // 直接恢复滚动位置
          requestAnimationFrame(() => {
            window.scrollTo(0, position);
            isRestoringRef.current = false;
          });
        }
      } else {
        isRestoringRef.current = false;
      }
    } catch (error) {
      console.error('恢复滚动位置失败:', error);
      isRestoringRef.current = false;
    }
  }, [pageKey, currentPageKey, itemHeight, bufferSize, displayCount, restoreScrollPositionFromStorage]);

  // 滚动到指定项目
  const scrollToItem = useCallback(
    (itemId: string, smooth: boolean = true) => {
      // 查找项目在数据中的位置
      let itemIndex = -1;
      let currentIndex = 0;

      for (const group of alternatives) {
        for (const item of group.result) {
          if (item.id === itemId) {
            itemIndex = currentIndex;
            break;
          }
          currentIndex++;
        }
        if (itemIndex !== -1) break;
      }

      if (itemIndex !== -1) {
        const targetScrollPosition = itemIndex * itemHeight;
        
        // 确保有足够的数据显示
        const requiredItems = Math.max(itemIndex + bufferSize, displayCount);
        
        if (requiredItems > displayCount) {
          // 先加载更多数据，然后滚动
          setTimeout(() => {
            window.scrollTo({
              top: targetScrollPosition,
              behavior: smooth ? 'smooth' : 'auto',
            });
          }, 300);
        } else {
          // 直接滚动
          window.scrollTo({
            top: targetScrollPosition,
            behavior: smooth ? 'smooth' : 'auto',
          });
        }
      }
    },
    [alternatives, itemHeight, bufferSize, displayCount]
  );

  // 滚动到底部
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    window.scrollTo({
      top: scrollHeight - clientHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // 滚动到顶部
  const scrollToTop = useCallback((smooth: boolean = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // 计算虚拟滚动的样式
  const getVirtualScrollStyle = useMemo(() => {
    if (!enableVirtualScroll) return {};
    
    return {
      height: `${alternatives.length * itemHeight}px`,
      position: 'relative' as const,
    };
  }, [alternatives.length, itemHeight, enableVirtualScroll]);

  // 获取可见项目的样式
  const getVisibleItemStyle = useCallback(
    (index: number) => {
      if (!enableVirtualScroll) return {};
      
      return {
        position: 'absolute' as const,
        top: `${index * itemHeight}px`,
        height: `${itemHeight}px`,
        width: '100%',
      };
    },
    [itemHeight, enableVirtualScroll]
  );

  // 监听滚动事件
  useEffect(() => {
    // 使用window滚动事件
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // 页面离开时保存滚动位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      saveScrollPositionToStorage(currentScrollPosition);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        saveScrollPositionToStorage(currentScrollPosition);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveScrollPositionToStorage]);

  // 页面初始化时恢复滚动位置
  useEffect(() => {
    if (currentPageKey === pageKey && alternatives.length > 0) {
      restoreScrollPosition();
    }
  }, [currentPageKey, pageKey, alternatives.length, restoreScrollPosition]);

  return {
    // 引用
    scrollContainerRef,
    
    // 状态
    scrollPosition,
    scrollState,
    visibleRange,
    
    // 方法
    handleScroll,
    scrollToItem,
    scrollToBottom,
    scrollToTop,
    restoreScrollPosition,
    
    // 虚拟滚动相关
    getVirtualScrollStyle,
    getVisibleItemStyle,
    isRestoring: isRestoringRef.current,
  };
}; 