// 定义每个维度的颜色配置
export const dimensionColors = {
  看: {
    like: '#FFE4E1', // 浅粉红
    talent: '#E6F3FF' // 浅天蓝
  },
  听: {
    like: '#FFF0F5', // 浅薰衣草
    talent: '#F0F8FF' // 爱丽丝蓝
  },
  说: {
    like: '#FFF5EE', // 浅海贝
    talent: '#F0FFFF' // 浅青
  },
  记: {
    like: '#FFEFD5', // 浅杏
    talent: '#F5FFFA' // 薄荷白
  },
  想: {
    like: '#FFFAF0', // 花白
    talent: '#F8F8FF' // 幽灵白
  },
  做: {
    like: '#FDF5E6', // 老花白
    talent: '#F5F5F5' // 白烟
  },
  运动: {
    like: '#FAF0E6', // 亚麻白
    talent: '#F0FFF0' // 蜜瓜白
  }
};

// 获取维度的颜色
export const getDimensionColor = (dimension: string, type: 'like' | 'talent'): string => {
  return dimensionColors[dimension as keyof typeof dimensionColors]?.[type] || '#F5F5F5';
};