import React from 'react';
import { Card, Tabs, List, Row, Col, Typography, Alert } from 'antd';
import styled from '@emotion/styled';

const { Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

interface Trait {
  trait: string;
  positive: string;
  negative: string;
}

interface DoubleEdgedAnalysisProps {
  manifestedTraits: Trait[];
  potentialTraits: Trait[];
}

const DoubleEdgedAnalysis: React.FC<DoubleEdgedAnalysisProps> = ({
  manifestedTraits = [],
  potentialTraits = []
}) => {
  return (
    <StyledCard title="性格特征双刃剑分析">
      <Alert
        type="info"
        message="关于双刃剑特征"
        description="双刃剑特征指的是某些性格特点既有积极的一面，也有需要注意的方面。了解这些特征有助于扬长避短，更好地发展。"
        style={{ marginBottom: 16 }}
      />
      <Tabs
        items={[
          {
            key: '1',
            label: '已显现特征',
            children: (
              <List
                dataSource={manifestedTraits}
                renderItem={item => (
                  <List.Item>
                    <Card title={item.trait} style={{ width: '100%' }}>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Text type="success">优势：{item.positive}</Text>
                        </Col>
                        <Col span={12}>
                          <Text type="warning">风险：{item.negative}</Text>
                        </Col>
                      </Row>
                    </Card>
                  </List.Item>
                )}
              />
            )
          },
          {
            key: '2',
            label: '潜在特征',
            children: (
              <List
                dataSource={potentialTraits}
                renderItem={item => (
                  <List.Item>
                    <Card title={item.trait} style={{ width: '100%' }}>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Text type="success">潜在优势：{item.positive}</Text>
                        </Col>
                        <Col span={12}>
                          <Text type="warning">需要注意：{item.negative}</Text>
                        </Col>
                      </Row>
                    </Card>
                  </List.Item>
                )}
              />
            )
          }
        ]}
      />
    </StyledCard>
  );
};

export default DoubleEdgedAnalysis;