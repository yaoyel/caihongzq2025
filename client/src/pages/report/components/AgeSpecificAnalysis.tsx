import React from 'react';
import { Card, Collapse, List, Typography } from 'antd';
import styled from '@emotion/styled';

const { Panel } = Collapse;
const { Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

interface Solution {
  title: string;
  solutions: string[];
}

interface AgeSpecificAnalysisProps {
  anxietyIssues: Solution[];
  learningObstacles: Solution[];
  capacityBuilding: Solution[];
}

const AgeSpecificAnalysis: React.FC<AgeSpecificAnalysisProps> = ({
  anxietyIssues = [],
  learningObstacles = [],
  capacityBuilding = []
}) => {
  return (
    <StyledCard title="年龄段个性化分析">
      <Collapse>
        <Panel header="焦虑问题及解决方案" key="1">
          <List
            dataSource={anxietyIssues}
            renderItem={item => (
              <List.Item>
                <Card title={item.title} style={{ width: '100%' }}>
                  <ul>
                    {item.solutions.map((solution, index) => (
                      <li key={index}>{solution}</li>
                    ))}
                  </ul>
                </Card>
              </List.Item>
            )}
          />
        </Panel>
        <Panel header="学习障碍及改进方法" key="2">
          <List
            dataSource={learningObstacles}
            renderItem={item => (
              <List.Item>
                <Card title={item.title} style={{ width: '100%' }}>
                  <ul>
                    {item.solutions.map((solution, index) => (
                      <li key={index}>{solution}</li>
                    ))}
                  </ul>
                </Card>
              </List.Item>
            )}
          />
        </Panel>
        <Panel header="能力建设建议" key="3">
          <List
            dataSource={capacityBuilding}
            renderItem={item => (
              <List.Item>
                <Card title={item.title} style={{ width: '100%' }}>
                  <ul>
                    {item.solutions.map((solution, index) => (
                      <li key={index}>{solution}</li>
                    ))}
                  </ul>
                </Card>
              </List.Item>
            )}
          />
        </Panel>
      </Collapse>
    </StyledCard>
  );
};

export default AgeSpecificAnalysis;