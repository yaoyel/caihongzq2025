import React from 'react';
import { Card, Row, Col, Progress, Typography } from 'antd';
import styled from '@emotion/styled';

const { Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

const PerformanceCard = styled(Card)`
  text-align: center;
  .ant-card-head {
    min-height: 48px;
    .ant-card-head-title {
      padding: 8px 0;
    }
  }
`;

interface Performance {
  name: string;
  score: number;
  color?: string;
}

interface ClassroomPerformanceProps {
  performances: Performance[];
}

const ClassroomPerformance: React.FC<ClassroomPerformanceProps> = ({
  performances = []
}) => {
  return (
    <StyledCard title="课堂表现分析">
      <Row gutter={24}>
        {performances.map(item => (
          <Col span={8} key={item.name}>
            <PerformanceCard title={item.name} bordered={false}>
              <Progress
                type="circle"
                percent={item.score}
                format={percent => `${percent}分`}
                strokeColor={item.color}
              />
            </PerformanceCard>
          </Col>
        ))}
      </Row>
    </StyledCard>
  );
};

export default ClassroomPerformance;