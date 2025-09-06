import React, { useState, useEffect } from 'react';
import { Picker } from 'antd-mobile';
import { DownOutline } from 'antd-mobile-icons';
import styles from './CommonSelect.module.css';

// 通用选择项数据接口定义
export interface SelectOptionData {
  id: string;
  label: string;
  count?: number; // 可选的数量字段
  [key: string]: any; // 支持其他自定义字段
}

// 组件属性接口定义
interface CommonSelectProps {
  /** 选择项数据列表 */
  data: SelectOptionData[];
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 选择事件回调 */
  onSelect?: (value: string, option: SelectOptionData) => void;
  /** 清除事件回调 */
  onClear?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 下拉框宽度 */
  width?: number | string;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 是否显示数量标签 */
  showCount?: boolean;
  /** 自定义选项渲染函数 */
  optionRenderer?: (option: SelectOptionData) => React.ReactNode;
  /** 默认选中的值 */
  defaultValue?: string;
}

/**
 * 通用选择框组件
 * 使用 Antd Mobile 的 Picker 组件，支持位次段选择、专业选择、学校选择等多种场景
 */
const CommonSelect: React.FC<CommonSelectProps> = ({
  data = [],
  placeholder = '请选择',
  disabled = false,
  onSelect,
  onClear,
  className = '',
  width = '100%',
  allowClear = true,
  showCount = true,
  optionRenderer,
  defaultValue
}) => {

  // 当前选中的值
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue || '');

  // 初始化默认值
  useEffect(() => {
    if (defaultValue && data.length > 0) {
      const defaultOption = data.find(item => item.id === defaultValue);
      if (defaultOption && onSelect) {
        onSelect(defaultValue, defaultOption);
      }
    }
  }, [defaultValue, data]); // 移除 onSelect 依赖，避免无限循环

  /**
   * 处理选择事件
   * @param value 选中的值
   */
  const handleSelect = (value: any[]) => {
    const selectedId = value[0];
    if (selectedId) {
      setSelectedValue(selectedId);
      
      // 查找选中的选项数据
      const selectedOption = data.find(item => item.id === selectedId);
      
      // 触发外部回调
      if (onSelect && selectedOption) {
        onSelect(selectedId, selectedOption);
      }
    }
  };

  /**
   * 处理清除事件
   */
  const handleClear = () => {
    setSelectedValue('');
    if (onClear) {
      onClear();
    }
  };

  /**
   * 获取当前选中项的显示文本
   */
  const getDisplayText = () => {
    if (!selectedValue) return placeholder;
    const selectedOption = data.find(item => item.id === selectedValue);
    if (!selectedOption) return placeholder;
    
    if (optionRenderer) {
      return selectedOption.label;
    }
    
    return showCount && selectedOption.count !== undefined 
      ? `${selectedOption.label} (${selectedOption.count}个)`
      : selectedOption.label;
  };

  /**
   * 转换数据格式为 Picker 需要的格式
   */
  const pickerColumns = [
    data.map(item => ({
      label: optionRenderer ? optionRenderer(item) : (
        showCount && item.count !== undefined 
          ? `${item.label} (${item.count}个)`
          : item.label
      ),
      value: item.id
    }))
  ];


  return (
    <div className={`${styles.commonSelect} ${className}`} style={{ width }}>
      <Picker
        columns={pickerColumns}
        value={selectedValue ? [selectedValue] : []}
        onConfirm={handleSelect}
        title="请选择"
      >
        {(_items, { open }) => (
          <div 
            className={styles.pickerTrigger}
            onClick={() => !disabled && open()}
            style={{ 
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <div className={styles.displayText}>
              {getDisplayText()}
            </div>
            <DownOutline className={styles.arrowIcon} />
            {allowClear && selectedValue && (
              <div 
                className={styles.clearButton}
                style={{
                  width: '60px',
                  height: '20px',
                  background: '#2563eb',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                ✕清除
              </div>
            )}
          </div>
        )}
      </Picker>
    </div>
  );
};

export default CommonSelect; 