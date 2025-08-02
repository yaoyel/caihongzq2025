# AI 志愿页面滚动位置恢复功能

## 问题描述
当用户从 AI 志愿页面跳转到其他页面后，再通过 `window.history.back()` 返回时，页面无法定位到跳转之前的位置。

## 解决方案

### 1. Redux 状态管理
创建了 `aiVolunteerSlice.ts` 来管理页面状态，包括：
- 滚动位置 (`scrollPosition`)
- 显示数量 (`displayCount`)
- 排序方式 (`sortTab`)
- 备选状态 (`alternativeStatus`)
- 加载状态 (`loading`, `loadingStatus`)
- 推荐数量 (`recommendCount`)
- 数据缓存 (`alternatives`)
- 页面标识 (`pageKey`)
- 初始化状态 (`hasInitialized`)

### 2. 滚动位置保存机制
- 使用节流处理滚动事件，每 100ms 保存一次滚动位置
- 同时保存到 Redux 状态和 localStorage
- localStorage 作为备用方案，确保页面刷新后也能恢复位置

### 3. 滚动位置恢复机制
- 检测页面是否是从返回操作进入的（使用 `performance.getEntriesByType('navigation')`）
- 从 localStorage 读取保存的滚动位置
- 延迟 300ms 恢复滚动位置，确保 DOM 已完全渲染

### 4. 关键代码实现

#### 滚动位置保存
```typescript
// 保存滚动位置到 localStorage
useEffect(() => {
  const handleScroll = () => {
    const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    localStorage.setItem('aiVolunteerScrollPosition', currentScrollPosition.toString());
    dispatch(setScrollPosition(currentScrollPosition));
  };

  // 节流处理滚动事件
  let timeoutId: NodeJS.Timeout;
  const throttledScrollHandler = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(handleScroll, 100);
  };

  window.addEventListener('scroll', throttledScrollHandler);
  
  return () => {
    window.removeEventListener('scroll', throttledScrollHandler);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}, [dispatch]);
```

#### 滚动位置恢复
```typescript
// 页面返回时恢复滚动位置
useEffect(() => {
  // 检查是否是从返回操作进入的页面
  const isBackNavigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const isReturningFromBack = isBackNavigation?.type === 'back_forward';
  
  if (isReturningFromBack && !loading && hasInitialized) {
    // 从 localStorage 获取保存的滚动位置
    const savedScrollPosition = localStorage.getItem('aiVolunteerScrollPosition');
    if (savedScrollPosition) {
      const scrollPosition = parseInt(savedScrollPosition, 10);
      if (scrollPosition > 0) {
        // 延迟恢复滚动位置，确保DOM已渲染
        const timer = setTimeout(() => {
          window.scrollTo(0, scrollPosition);
          console.log('恢复滚动位置:', scrollPosition);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }
}, [loading, hasInitialized]);
```

## 使用说明

1. **自动保存**：用户滚动时，滚动位置会自动保存到 Redux 状态和 localStorage
2. **自动恢复**：当用户通过返回按钮回到页面时，会自动恢复到之前的滚动位置
3. **备用机制**：即使 Redux 状态丢失，也能从 localStorage 恢复位置

## 技术特点

- ✅ 使用 Redux 进行状态管理
- ✅ 节流处理滚动事件，避免性能问题
- ✅ 双重保存机制（Redux + localStorage）
- ✅ 智能检测返回操作
- ✅ 延迟恢复确保 DOM 渲染完成
- ✅ 中文注释和错误处理

## 测试建议

1. 在 AI 志愿页面滚动到中间位置
2. 点击某个学校或专业跳转到详情页
3. 点击返回按钮回到 AI 志愿页面
4. 验证页面是否恢复到之前的滚动位置 