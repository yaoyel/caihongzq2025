import React from 'react';
import { Card, Progress, List, Typography, Tag, Tooltip } from 'antd';
import styled from '@emotion/styled';

const { Text } = Typography;

const ReportCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

interface DimensionData {
  dimension: string;
  score: number;
  analysis: string;
}

interface ClassroomPerformanceProps {
  dimensions: DimensionData[];
}

const ClassroomPerformance: React.FC<ClassroomPerformanceProps> = ({ dimensions }) => {
  const getDimensionColor = (dimension: string) => {
    const colorMap: Record<string, string> = {
      '看': '#1890ff',
      '听': '#52c41a',
      '说': '#faad14',
      '记': '#722ed1',
      '想': '#eb2f96',
      '做': '#fa541c',
      '运动': '#13c2c2'
    };
    return colorMap[dimension] || '#1890ff';
  };

  return (
    <ReportCard
      title="课堂表现分析"
      bordered={false}
    >
      <List
        dataSource={dimensions}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                <Tag color={getDimensionColor(item.dimension)} style={{ marginRight: 8 }}>
                  {item.dimension}
                </Tag>
                <Text strong>{item.score}分</Text>
              </div>
              <Tooltip title={item.analysis}>
                <Progress
                  percent={item.score}
                  strokeColor={getDimensionColor(item.dimension)}
                  showInfo={false}
                />
              </Tooltip>
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                {item.analysis}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </ReportCard>
  );
};

export default ClassroomPerformance;