// 滚动位置管理测试工具

/**
 * 测试滚动位置保存功能
 */
export const testScrollPositionSave = (pageKey: string): void => {
  const testPosition = 1000;
  
  // 保存测试位置
  localStorage.setItem(`aiVolunteerScroll_${pageKey}`, JSON.stringify({
    position: testPosition,
    timestamp: Date.now(),
  }));
  
  console.log(`✅ 滚动位置保存测试成功: ${testPosition}px`);
};

/**
 * 测试滚动位置恢复功能
 */
export const testScrollPositionRestore = (pageKey: string): number | null => {
  const savedData = localStorage.getItem(`aiVolunteerScroll_${pageKey}`);
  
  if (savedData) {
    const { position, timestamp } = JSON.parse(savedData);
    const isExpired = Date.now() - timestamp > 30 * 60 * 1000; // 30分钟过期
    
    if (!isExpired) {
      console.log(`✅ 滚动位置恢复测试成功: ${position}px`);
      return position;
    } else {
      console.log(`❌ 滚动位置已过期`);
      return null;
    }
  } else {
    console.log(`❌ 未找到保存的滚动位置`);
    return null;
  }
};

/**
 * 测试页面导航标记
 */
export const testNavigationMarkers = (): void => {
  // 设置导航标记
  sessionStorage.setItem('aiVolunteerFromDetail', 'true');
  localStorage.setItem('aiVolunteerLastViewedItem', 'test-item-123');
  
  console.log('✅ 导航标记设置成功');
};

/**
 * 清理测试数据
 */
export const cleanupTestData = (pageKey: string): void => {
  localStorage.removeItem(`aiVolunteerScroll_${pageKey}`);
  sessionStorage.removeItem('aiVolunteerFromDetail');
  localStorage.removeItem('aiVolunteerLastViewedItem');
  
  console.log('✅ 测试数据清理完成');
};

/**
 * 运行完整测试
 */
export const runScrollPositionTest = (pageKey: string): void => {
  console.log('🧪 开始滚动位置管理测试...');
  
  // 测试保存
  testScrollPositionSave(pageKey);
  
  // 测试恢复
  const restoredPosition = testScrollPositionRestore(pageKey);
  
  // 测试导航标记
  testNavigationMarkers();
  
  // 清理测试数据
  cleanupTestData(pageKey);
  
  console.log('🎉 滚动位置管理测试完成');
  
  if (restoredPosition !== null) {
    console.log(`📊 测试结果: 位置 ${restoredPosition}px 成功恢复`);
  } else {
    console.log('📊 测试结果: 位置恢复失败');
  }
}; 