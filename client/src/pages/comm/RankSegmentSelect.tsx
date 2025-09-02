import React from 'react';
import CommonSelect, { SelectOptionData } from './CommonSelect';

// 位次段数据接口定义
export interface RankSegmentData {
  groupId: string;  // 组ID
  name: string;     // 位次段名称
  count: number;    // 可选志愿数量
}

// 位次段选择框属性接口
interface RankSegmentSelectProps {
  /** 位次段数据列表 */
  data: RankSegmentData[];
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 选择事件回调 */
  onSelect?: (value: string, option: RankSegmentData) => void;
  /** 清除事件回调 */
  onClear?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 下拉框宽度 */
  width?: number | string;
  /** 是否允许清除 */
  allowClear?: boolean;
}

/**
 * 位次段选择框组件
 * 基于 CommonSelect 组件封装，专门用于位次段选择
 */
const RankSegmentSelect: React.FC<RankSegmentSelectProps> = ({
  data = [],
  placeholder = '请选择位次段',
  disabled = false,
  onSelect,
  onClear,
  className = '',
  width = '100%',
  allowClear = true
}) => {
  /**
   * 将 RankSegmentData 转换为 SelectOptionData
   */
  const convertToSelectData = (rankData: RankSegmentData[]): SelectOptionData[] => {
    return rankData.map(item => ({
      id: item.groupId,
      label: item.name,
      count: item.count
    }));
  };

  /**
   * 处理选择事件，进行类型转换
   */
  const handleSelect = (value: string) => {
    if (onSelect) {
      // 找到对应的原始数据
      const originalData = data.find(item => item.groupId === value);
      if (originalData) {
        onSelect(value, originalData);
      }
    }
  };

  return (
    <CommonSelect
      data={convertToSelectData(data)}
      placeholder={placeholder}
      disabled={disabled}
      onSelect={handleSelect}
      onClear={onClear}
      className={`rank-segment-select ${className}`}
      width={width}
      allowClear={allowClear}
      showCount={true}
    />
  );
};

export default RankSegmentSelect; 