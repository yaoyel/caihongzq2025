import React from 'react';
import { Typography, Card, Row, Col, Progress, Tag, Button, List } from 'antd';
import { Radar } from '@ant-design/plots';
import styled from '@emotion/styled';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const StyledCard = styled(Card)`
  margin: 20px 0;
  .ant-card-body {
    padding: 24px;
  }
`;

const WarningTag = styled(Tag)`
  margin: 4px;
  padding: 4px 8px;
`;

const ReportPage: React.FC = () => {
  const navigate = useNavigate();

  const mockData = {
    dimensions: [
      { name: '认知力', score: 85 },
      { name: '创造力', score: 92 },
      { name: '运动力', score: 75 },
      { name: '艺术力', score: 88 },
      { name: '社交力', score: 95 },
      { name: '内省力', score: 82 },
      { name: '自然力', score: 78 }
    ],
    talents: [
      {
        name: '空间思维',
        score: 95,
        rank: 'TOP 5%',
        potential: '极高',
        suggestions: [
          '推荐参加机器人编程课程',
          '可以尝试3D建模设计',
          '适合参加创客空间活动'
        ]
      }
    ],
    warnings: [
      {
        type: '注意力分散',
        level: '中度',
        description: '在需要长时间专注的活动中容易分心',
        suggestions: [
          '建议采用番茄工作法',
          '环境要保持安静整洁',
          '可以尝试正念练习'
        ]
      }
    ]
  };

  const radarConfig = {
    data: mockData.dimensions.map(d => ({
      name: d.name,
      value: d.score
    })),
    xField: 'name',
    yField: 'value',
    meta: {
      value: {
        min: 0,
        max: 100
      }
    },
    area: {
      style: {
        fill: '#FFD700',
        fillOpacity: 0.3
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Button 
        icon={<HomeOutlined />} 
        onClick={() => navigate('/home')}
        style={{ marginBottom: '20px' }}
      >
        返回主页
      </Button>

      <Title level={2}>天赋测评报告</Title>

      <StyledCard title="能力维度分析">
        <Radar {...radarConfig} />
      </StyledCard>

      <StyledCard title="突出天赋">
        {mockData.talents.map((talent, index) => (
          <div key={index}>
            <Row gutter={[16, 16]} align="middle">
              <Col span={16}>
                <Title level={4}>{talent.name}</Title>
                <Paragraph>
                  潜力评级：
                  <Tag color="gold">{talent.potential}</Tag>
                  <Tag color="blue">{talent.rank}</Tag>
                </Paragraph>
              </Col>
              <Col span={8}>
                <Progress
                  type="circle"
                  percent={talent.score}
                  format={percent => `${percent}分`}
                />
              </Col>
            </Row>

            <List
              header="发展建议"
              dataSource={talent.suggestions}
              renderItem={item => (
                <List.Item>
                  <Paragraph>{item}</Paragraph>
                </List.Item>
              )}
            />
          </div>
        ))}
      </StyledCard>

      <StyledCard title="需要注意">
        {mockData.warnings.map((warning, index) => (
          <div key={index}>
            <WarningTag color="red">{warning.type}</WarningTag>
            <WarningTag color="orange">风险等级：{warning.level}</WarningTag>
            <Paragraph style={{ margin: '16px 0' }}>
              {warning.description}
            </Paragraph>
            <List
              header="改进建议"
              dataSource={warning.suggestions}
              renderItem={item => (
                <List.Item>
                  <Paragraph>{item}</Paragraph>
                </List.Item>
              )}
            />
          </div>
        ))}
      </StyledCard>

      <Row justify="center" style={{ marginTop: '40px' }}>
        <Button type="primary" size="large">
          咨询专家解读
        </Button>
      </Row>
    </div>
  );
};

export default ReportPage; 