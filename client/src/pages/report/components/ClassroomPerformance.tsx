import React from 'react';
import { Card, Row, Col, Tooltip } from 'antd';
import styled from '@emotion/styled';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

const DimensionCard = styled(Card)`
  text-align: center;
  height: 100%;
  .ant-card-head {
    min-height: 48px;
    .ant-card-head-title {
      padding: 8px 0;
    }
  }
  .dimension-result {
    margin-top: 16px;
    font-size: 16px;
  }
  .dimension-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

interface DimensionRequirement {
  likes: string[];
  talents: string[];
}

interface Dimension {
  name: string;
  requirements: DimensionRequirement;
  result: string;
  satisfied: boolean;
  description: string;
}

interface ClassroomPerformanceProps {
  dimensions: Dimension[];
}

const ClassroomPerformance: React.FC<ClassroomPerformanceProps> = ({
  dimensions = []
}) => {
  return (
    <StyledCard title="课堂表现分析">
      <Row gutter={[24, 24]}>
        {dimensions.map(dimension => (
          <Col xs={24} sm={12} md={8} key={dimension.name}>
            <Tooltip title={
              <div>
                <p><strong>判断条件：</strong></p>
                <p>喜欢：{dimension.requirements.likes.join('、')}</p>
                <p>天赋：{dimension.requirements.talents.join('、')}</p>
                <p><strong>详细说明：</strong></p>
                <p>{dimension.description}</p>
              </div>
            }>
              <DimensionCard title={`${dimension.name}维度`} bordered={false}>
                <div className="dimension-icon">
                  {dimension.satisfied ? (
                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleFilled style={{ color: '#ff4d4f' }} />
                  )}
                </div>
                <div className="dimension-result">
                  {dimension.result}
                </div>
              </DimensionCard>
            </Tooltip>
          </Col>
        ))}
      </Row>
    </StyledCard>
  );
};

export default ClassroomPerformance;