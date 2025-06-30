/**
 * 工具函数集合
 */

/**
 * 从历年分数数据中获取位次平均值
 * @param historyScore 历年分数数据
 * @returns 位次平均值，如果没有则返回0
 */
export const getAverageRank = (historyScore: string | null): number => {
  try {
    if (!historyScore) return 0;
    
    // 解析JSON字符串为数组（如果已经是数组则直接使用）
    const scoresArray = typeof historyScore === 'string' 
      ? JSON.parse(historyScore)
      : historyScore;
      
    // 确保是数组
    if (!Array.isArray(scoresArray)) return 0;
    
    // 收集所有有效的位次数据
    const ranks: number[] = [];
    
    // 遍历每年的数据
    scoresArray.forEach((item: { [key: string]: string }) => {
      const year = Object.keys(item)[0];
      const scoreStr = item[year];
      
      if (scoreStr && scoreStr !== '-,-,-') {
        // 分割字符串，获取第二个值（位次）
        const [, rank] = scoreStr.split(',');
        const parsedRank = parseFloat(rank);
        
        // 如果是有效的数字就添加到数组中
        if (!isNaN(parsedRank)) {
          ranks.push(parsedRank);
        }
      }
    });
    
    // 如果没有有效的位次数据，返回0
    if (ranks.length === 0) return 0;
    
    // 计算平均值
    const sum = ranks.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / ranks.length);
    
  } catch (error) {
    console.error('解析位次数据出错：', error);
    return 0;
  }
};
