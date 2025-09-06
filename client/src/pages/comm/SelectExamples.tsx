import React from 'react';
import CommonSelect, { SelectOptionData } from './CommonSelect';
import RankSegmentSelect, { RankSegmentData } from './RankSegmentSelect';

/**
 * 选择框组件使用示例
 * 展示 CommonSelect 和 RankSegmentSelect 的使用方法
 */
const SelectExamples: React.FC = () => {
  // 位次段数据示例
  const rankSegmentData: RankSegmentData[] = [
    {
      groupId: '1',
      name: '【 +30%到+100%位次段】',
      count: 20
    },
    {
      groupId: '2', 
      name: '【 +5%到+30%位次段】',
      count: 28
    },
    {
      groupId: '3',
      name: '【（-10%）到+5%位次段】',
      count: 2
    },
    {
      groupId: '4',
      name: '【（-30%）到（-10%）位次段 】',
      count: 50
    },
    {
      groupId: '5',
      name: '【（-100%）到（-30%）位次段 】',
      count: 70
    },
    {
      groupId: '6',
      name: '【 其他位次段】',
      count: 1200
    }
  ];

  // 专业选择数据示例
  const majorData: SelectOptionData[] = [
    {
      id: 'major-1',
      label: '计算机科学与技术',
      count: 150
    },
    {
      id: 'major-2',
      label: '软件工程',
      count: 120
    },
    {
      id: 'major-3',
      label: '人工智能',
      count: 80
    },
    {
      id: 'major-4',
      label: '数据科学与大数据技术',
      count: 90
    }
  ];

  // 学校选择数据示例
  const schoolData: SelectOptionData[] = [
    {
      id: 'school-1',
      label: '清华大学',
      count: 50
    },
    {
      id: 'school-2',
      label: '北京大学',
      count: 45
    },
    {
      id: 'school-3',
      label: '复旦大学',
      count: 40
    },
    {
      id: 'school-4',
      label: '上海交通大学',
      count: 35
    }
  ];

  /**
   * 处理位次段选择事件
   */
  const handleRankSegmentSelect = (_value: string, option: RankSegmentData) => {
    console.log('选中的位次段:', option.name);
    console.log('可选志愿数量:', option.count);
  };

  /**
   * 处理专业选择事件
   */
  const handleMajorSelect = (_value: string, option: SelectOptionData) => {
    console.log('选中的专业:', option.label);
    console.log('可选学校数量:', option.count);
  };

  /**
   * 处理学校选择事件
   */
  const handleSchoolSelect = (_value: string, option: SelectOptionData) => {
    console.log('选中的学校:', option.label);
    console.log('可选专业数量:', option.count);
  };

  /**
   * 自定义选项渲染函数
   */
  const customOptionRenderer = (option: SelectOptionData) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{option.label}</span>
      <span style={{ 
        backgroundColor: '#52c41a', 
        color: 'white', 
        padding: '2px 8px', 
        borderRadius: '12px',
        fontSize: '12px'
      }}>
        {option.count}个
      </span>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>选择框组件示例</h2>
      
      {/* 位次段选择框 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>1. 位次段选择框 (RankSegmentSelect)</h3>
        <RankSegmentSelect
          data={rankSegmentData}
          onSelect={handleRankSegmentSelect}
          placeholder="请选择位次段"
          width={400}
        />
      </div>

      {/* 专业选择框 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>2. 专业选择框 (CommonSelect)</h3>
        <CommonSelect
          data={majorData}
          onSelect={handleMajorSelect}
          placeholder="请选择专业"
          width={400}
        />
      </div>

      {/* 学校选择框 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>3. 学校选择框 (CommonSelect)</h3>
        <CommonSelect
          data={schoolData}
          onSelect={handleSchoolSelect}
          placeholder="请选择学校"
          width={400}
        />
      </div>

      {/* 自定义渲染的选择框 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>4. 自定义渲染的选择框</h3>
        <CommonSelect
          data={majorData}
          onSelect={handleMajorSelect}
          placeholder="请选择专业（自定义样式）"
          width={400}
          optionRenderer={customOptionRenderer}
        />
      </div>

      {/* 禁用状态 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>5. 禁用状态</h3>
        <CommonSelect
          data={majorData}
          disabled={true}
          placeholder="禁用状态"
          width={400}
        />
      </div>

      {/* 不显示数量标签 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>6. 不显示数量标签</h3>
        <CommonSelect
          data={majorData}
          onSelect={handleMajorSelect}
          placeholder="请选择专业（无数量显示）"
          width={400}
          showCount={false}
        />
      </div>


    </div>
  );
};

export default SelectExamples; 