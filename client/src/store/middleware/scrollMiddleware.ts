import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';

// 滚动中间件配置
interface ScrollMiddlewareConfig {
  throttleDelay?: number;
  enableVirtualScroll?: boolean;
}

// 创建滚动中间件
export const createScrollMiddleware = (config: ScrollMiddlewareConfig = {}): Middleware => {
  const { throttleDelay = 100 } = config;
  
  let throttleTimeout: NodeJS.Timeout | null = null;
  let isRestoring = false;

  return (store) => (next) => (action: any) => {
    const result = next(action);
    const state = store.getState() as RootState;

    // 处理滚动位置保存
    if (action.type === 'aiVolunteer/setScrollPosition') {
      const { payload: scrollPosition } = action;
      const { pageKey } = state.aiVolunteer;

      if (!isRestoring && pageKey) {
        // 节流保存到localStorage
        if (throttleTimeout) {
          clearTimeout(throttleTimeout);
        }

        throttleTimeout = setTimeout(() => {
          localStorage.setItem(`aiVolunteerScroll_${pageKey}`, JSON.stringify({
            position: scrollPosition,
            timestamp: Date.now(),
          }));
        }, throttleDelay);
      }
    }

    // 处理页面初始化
    if (action.type === 'aiVolunteer/setHasInitialized' && action.payload === true) {
      const { pageKey } = state.aiVolunteer;
      
      if (pageKey) {
        // 尝试恢复滚动位置
        const savedData = localStorage.getItem(`aiVolunteerScroll_${pageKey}`);
        if (savedData) {
          const { position, timestamp } = JSON.parse(savedData);
          const isExpired = Date.now() - timestamp > 30 * 60 * 1000; // 30分钟过期
          
          if (!isExpired) {
            isRestoring = true;
            
            // 延迟恢复，确保DOM已经渲染
            setTimeout(() => {
              const scrollElement = document.querySelector('.xunigundong');
              if (scrollElement) {
                scrollElement.scrollTo(0, position);
              } else {
                window.scrollTo(0, position);
              }
              isRestoring = false;
            }, 100);
          }
        }
      }
    }

    // 处理页面离开
    if (action.type === 'aiVolunteer/resetState') {
      const { pageKey } = state.aiVolunteer;
      
      if (pageKey) {
        // 保存当前滚动位置
        const scrollElement = document.querySelector('.xunigundong');
        const currentScrollPosition = scrollElement ? scrollElement.scrollTop : window.pageYOffset || document.documentElement.scrollTop;
        localStorage.setItem(`aiVolunteerScroll_${pageKey}`, JSON.stringify({
          position: currentScrollPosition,
          timestamp: Date.now(),
        }));
      }
    }

    return result;
  };
};

// 默认滚动中间件
export const scrollMiddleware = createScrollMiddleware(); 