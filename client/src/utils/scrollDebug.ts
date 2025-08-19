// 滚动位置调试工具

/**
 * 调试滚动位置管理
 */
export const debugScrollPosition = () => {
  console.log('🔍 开始调试滚动位置管理...');
  
  // 检查xunigundong元素
  const xunigundongElement = document.querySelector('.xunigundong');
  console.log('📦 xunigundong元素:', xunigundongElement);
  
  if (xunigundongElement) {
    console.log('📊 xunigundong元素属性:');
    console.log('  - scrollTop:', xunigundongElement.scrollTop);
    console.log('  - scrollHeight:', xunigundongElement.scrollHeight);
    console.log('  - clientHeight:', xunigundongElement.clientHeight);
    console.log('  - offsetHeight:', (xunigundongElement as HTMLElement).offsetHeight);
    console.log('  - style.overflow:', (xunigundongElement as HTMLElement).style.overflow);
    console.log('  - computed overflow:', window.getComputedStyle(xunigundongElement).overflow);
    console.log('  - computed height:', window.getComputedStyle(xunigundongElement).height);
    console.log('  - computed maxHeight:', window.getComputedStyle(xunigundongElement).maxHeight);
  }
  
  // 检查window滚动位置
  console.log('🌐 window滚动位置:');
  console.log('  - pageYOffset:', window.pageYOffset);
  console.log('  - scrollY:', window.scrollY);
  console.log('  - document.documentElement.scrollTop:', document.documentElement.scrollTop);
  
  // 检查localStorage中的滚动位置
  const scrollKeys = Object.keys(localStorage).filter(key => key.includes('aiVolunteerScroll'));
  console.log('💾 localStorage中的滚动位置:', scrollKeys);
  
  scrollKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      console.log(`  - ${key}:`, data);
    } catch (error) {
      console.log(`  - ${key}: 解析失败`);
    }
  });
  
  // 检查sessionStorage
  const sessionKeys = Object.keys(sessionStorage).filter(key => key.includes('aiVolunteer'));
  console.log('📝 sessionStorage中的标记:', sessionKeys);
  
  sessionKeys.forEach(key => {
    console.log(`  - ${key}:`, sessionStorage.getItem(key));
  });
};

/**
 * 测试滚动位置保存
 */
export const testScrollPositionSave = (pageKey: string) => {
  console.log('💾 测试滚动位置保存...');
  
  const xunigundongElement = document.querySelector('.xunigundong');
  const scrollTop = xunigundongElement ? xunigundongElement.scrollTop : window.pageYOffset;
  
  const saveData = {
    position: scrollTop,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(`aiVolunteerScroll_${pageKey}`, JSON.stringify(saveData));
  console.log('✅ 保存的滚动位置:', saveData);
  
  return scrollTop;
};

/**
 * 测试滚动位置恢复
 */
export const testScrollPositionRestore = (pageKey: string) => {
  console.log('🔄 测试滚动位置恢复...');
  
  const savedData = localStorage.getItem(`aiVolunteerScroll_${pageKey}`);
  if (!savedData) {
    console.log('❌ 未找到保存的滚动位置');
    return null;
  }
  
  try {
    const { position, timestamp } = JSON.parse(savedData);
    const isExpired = Date.now() - timestamp > 30 * 60 * 1000;
    
    console.log('📊 恢复数据:', { position, timestamp, isExpired });
    
    if (!isExpired) {
      console.log('🎯 滚动到window位置:', position);
      console.log('🎯 滚动前pageYOffset:', window.pageYOffset);
      window.scrollTo(0, position);
      console.log('🎯 滚动后pageYOffset:', window.pageYOffset);
      return position;
    } else {
      console.log('⏰ 滚动位置已过期');
      return null;
    }
  } catch (error) {
    console.log('❌ 解析保存的滚动位置失败:', error);
    return null;
  }
};

/**
 * 模拟滚动事件
 */
export const simulateScroll = (targetPosition: number) => {
  console.log('🎮 模拟滚动到位置:', targetPosition);
  
  // 使用window滚动
  console.log('🎮 滚动前pageYOffset:', window.pageYOffset);
  window.scrollTo(0, targetPosition);
  console.log('🎮 滚动后pageYOffset:', window.pageYOffset);
  
  console.log('✅ 已滚动window到位置:', targetPosition);
};

/**
 * 检查元素是否存在
 */
export const checkElements = () => {
  console.log('🔍 检查页面元素...');
  
  const elements = [
    '.xunigundong',
    '[ref="scrollContainerRef"]',
    '.scroll-container',
    '.virtual-scroll'
  ];
  
  elements.forEach(selector => {
    const element = document.querySelector(selector);
    console.log(`${selector}:`, element ? '✅ 存在' : '❌ 不存在');
    if (element) {
      console.log(`  - 类型:`, element.tagName);
      console.log(`  - 类名:`, element.className);
      console.log(`  - 样式:`, window.getComputedStyle(element).overflow);
      console.log(`  - 高度:`, window.getComputedStyle(element).height);
      console.log(`  - 最大高度:`, window.getComputedStyle(element).maxHeight);
    }
  });
};

/**
 * 强制滚动到指定位置
 */
export const forceScrollTo = (targetPosition: number) => {
  console.log('💪 强制滚动到位置:', targetPosition);
  
  // 使用window滚动
  window.scrollTo(0, targetPosition);
  console.log('✅ 强制滚动window完成');
};

/**
 * 检查CSS样式问题
 */
export const checkCSSIssues = () => {
  console.log('🎨 检查CSS样式问题...');
  
  const xunigundongElement = document.querySelector('.xunigundong');
  if (xunigundongElement) {
    const computedStyle = window.getComputedStyle(xunigundongElement);
    
    console.log('📊 关键CSS属性:');
    console.log('  - overflow:', computedStyle.overflow);
    console.log('  - overflow-y:', computedStyle.overflowY);
    console.log('  - height:', computedStyle.height);
    console.log('  - max-height:', computedStyle.maxHeight);
    console.log('  - position:', computedStyle.position);
    console.log('  - display:', computedStyle.display);
    
    // 检查是否有阻止滚动的样式
    if (computedStyle.overflow === 'hidden') {
      console.log('⚠️ 警告: overflow设置为hidden，可能阻止滚动');
    }
    
    if (computedStyle.height === 'auto' && computedStyle.maxHeight === 'none') {
      console.log('⚠️ 警告: 高度可能未正确设置');
    }
  }
};

/**
 * 运行完整调试
 */
export const runScrollDebug = (pageKey: string = 'ai-volunteer-test') => {
  console.log('🚀 开始完整滚动调试...');
  
  // 检查元素
  checkElements();
  
  // 检查CSS问题
  checkCSSIssues();
  
  // 调试当前状态
  debugScrollPosition();
  
  // 测试保存
  const savedPosition = testScrollPositionSave(pageKey);
  
  // 测试恢复
  const restoredPosition = testScrollPositionRestore(pageKey);
  
  console.log('📊 调试结果:');
  console.log('  - 保存位置:', savedPosition);
  console.log('  - 恢复位置:', restoredPosition);
  console.log('  - 是否成功:', savedPosition === restoredPosition);
  
  return { savedPosition, restoredPosition };
}; 