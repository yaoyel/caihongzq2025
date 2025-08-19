import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { setScrollPosition } from '../store/slices/aiVolunteerSlice';

// 滚动位置管理hook的配置选项
interface ScrollPositionOptions {
  pageKey: string;
  throttleDelay?: number; // 节流延迟
}

export const useScrollPosition = (options: ScrollPositionOptions) => {
  const { pageKey, throttleDelay = 100 } = options;
  const dispatch = useDispatch<AppDispatch>();
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();
  const isRestoringRef = useRef(false);

  // 保存滚动位置到localStorage
  const saveScrollPosition = useCallback((position: number) => {
    localStorage.setItem(`aiVolunteerScroll_${pageKey}`, JSON.stringify({
      position,
      timestamp: Date.now(),
    }));
  }, [pageKey]);

  // 从localStorage恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
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
  const throttledScrollHandler = useCallback((scrollTop: number) => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }

    throttleTimeoutRef.current = setTimeout(() => {
      if (!isRestoringRef.current) {
        // 更新Redux状态
        dispatch(setScrollPosition(scrollTop));
        // 保存到localStorage
        saveScrollPosition(scrollTop);
      }
    }, throttleDelay);
  }, [dispatch, saveScrollPosition, throttleDelay]);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (isRestoringRef.current) return;

    // 查找xunigundong元素
    const scrollElement = document.querySelector('.xunigundong');
    const scrollTop = scrollElement ? scrollElement.scrollTop : window.pageYOffset || document.documentElement.scrollTop;
    throttledScrollHandler(scrollTop);
  }, [throttledScrollHandler]);

  // 滚动到指定位置
  const scrollToPosition = useCallback((position: number, smooth: boolean = false) => {
    isRestoringRef.current = true;
    
    // 查找xunigundong元素
    const scrollElement = document.querySelector('.xunigundong');
    if (scrollElement) {
      scrollElement.scrollTo({
        top: position,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      // 降级到window滚动
      window.scrollTo({
        top: position,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }

    // 恢复完成后重置标志
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);
  }, []);

  // 滚动到指定项目
  const scrollToItem = useCallback((_itemId: string, _itemHeight: number = 200) => {
    // 这里可以根据itemId查找项目位置
    // 简化实现，直接使用localStorage中保存的位置
    const position = restoreScrollPosition();
    if (position !== null) {
      scrollToPosition(position);
    }
  }, [restoreScrollPosition, scrollToPosition]);

  // 监听滚动事件
  useEffect(() => {
    // 查找xunigundong元素
    const scrollElement = document.querySelector('.xunigundong');
    
    if (scrollElement) {
      // 监听xunigundong元素的滚动事件
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current);
        }
      };
    } else {
      // 降级到window滚动事件
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  // 页面离开时保存滚动位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      const scrollElement = document.querySelector('.xunigundong');
      const currentScrollPosition = scrollElement ? scrollElement.scrollTop : window.pageYOffset || document.documentElement.scrollTop;
      saveScrollPosition(currentScrollPosition);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const scrollElement = document.querySelector('.xunigundong');
        const currentScrollPosition = scrollElement ? scrollElement.scrollTop : window.pageYOffset || document.documentElement.scrollTop;
        saveScrollPosition(currentScrollPosition);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveScrollPosition]);

  return {
    // 方法
    handleScroll,
    scrollToPosition,
    scrollToItem,
    restoreScrollPosition,
    saveScrollPosition,
    
    // 状态
    isRestoring: isRestoringRef.current,
  };
}; 