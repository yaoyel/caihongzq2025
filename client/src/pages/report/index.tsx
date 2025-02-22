import React, { useState, useRef, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Collapse, Tabs, Progress, List, Tag, Button, Divider, message, Space, Tooltip, Alert } from 'antd';
import { Radar } from '@ant-design/plots';
import styled from '@emotion/styled';
import { HomeOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { getApiUrl } from '../../config';

// 子组件
import TalentAnalysis from './components/TalentAnalysis';
import DoubleEdgedAnalysis from './components/DoubleEdgedAnalysis';
import ClassroomPerformance from './components/ClassroomPerformance';
import AgeSpecificAnalysis from './components/AgeSpecificAnalysis';
import DevelopmentSuggestions from './components/DevelopmentSuggestions';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const StyledLayout = styled(Layout)`
  padding: 24px 48px;
  background: #fff;
`;

const ReportCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

const ReportTitle = styled(Title)`
  text-align: center;
  margin-bottom: 48px !important;
  
  &::after {
    content: '';
    display: block;
    width: 60px;
    height: 3px;
    background: #1890ff;
    margin: 16px auto 0;
  }
`;

const WarningTag = styled(Tag)`
  margin: 4px;
  padding: 4px 8px;
`;

// 添加打印样式
const PrintableContent = styled.div`
  @media print {
    .no-print {
      display: none;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .ant-card {
      break-inside: avoid;
    }
  }
`;

interface TalentAnalysis {
  dimension: string;
  hasTalent: boolean;
  hasInterest: boolean;
}

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);
  const dimensions = ['看', '听', '说', '记', '想', '做', '运动'];
  
  const [dimensionScores, setDimensionScores] = useState<Record<string, number>>({});
  const [talentAnalysisData, setTalentAnalysisData] = useState<any>(null);
  const [elementAnalysisData, setElementAnalysisData] = useState<any>(null);
  const [doubleEdgedTraits, setDoubleEdgedTraits] = useState({
    manifested: [
      { trait: '好强心理', positive: '追求卓越', negative: '容易产生挫败感' },
      { trait: '创新思维', positive: '思维活跃', negative: '注意力容易分散' }
    ],
    potential: []
  });
  const [performances] = useState([
    { name: '专注度', score: 85, color: '#1890ff' },
    { name: '参与度', score: 88, color: '#52c41a' },
    { name: '理解力', score: 92, color: '#722ed1' },
    { name: '表达力', score: 78, color: '#fa8c16' },
    { name: '合作性', score: 95, color: '#eb2f96' },
    { name: '自主性', score: 82, color: '#faad14' },
    { name: '创造力', score: 90, color: '#13c2c2' }
  ]);
  const [ageSpecificData] = useState({
    anxietyIssues: [
      {
        title: '学业压力',
        solutions: ['制定合理的学习计划', '培养良好的学习习惯', '适当的运动放松']
      },
      {
        title: '人际关系',
        solutions: ['参加团体活动', '提升沟通技巧', '建立自信心']
      }
    ],
    learningObstacles: [],
    capacityBuilding: []
  });
  const [developmentSuggestions] = useState([
    '充分发挥人际交往能力，参与更多团队活动',
    '注意力训练，提高学习效率',
    '平衡个人发展，建立健康的学习心态'
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scaleResponse, talentResponse, elementResponse] = await Promise.all([
          axios.get(getApiUrl('/scales/answers/user/1/summary')),
          axios.get(getApiUrl('/report/talent-analysis/1')),
          axios.get(getApiUrl('/report/element-analysis/1'))
        ]);

        const answers = scaleResponse.data;
        const scores: Record<string, { total: number; count: number }> = {};
        answers.forEach((answer: any) => {
          const { dimension, score } = answer;
          if (!scores[dimension]) {
            scores[dimension] = { total: 0, count: 0 };
          }
          scores[dimension].total += score;
          scores[dimension].count += 1;
        });

        const averageScores = Object.entries(scores).reduce((acc, [dimension, { total, count }]) => {
          acc[dimension] = (total / count) * 20;
          return acc;
        }, {} as Record<string, number>);

        setDimensionScores(averageScores);
        setTalentAnalysisData(talentResponse.data);
        setElementAnalysisData(elementResponse.data);
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      }
    };

    fetchData();
  }, []);

  const handleExportPDF = () => {
    const element = componentRef.current;
    if (!element) return;

    const opt = {
      margin: 1,
      filename: '学生综合能力评估报告.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const radarConfig = {
    data: Object.entries(dimensionScores).map(([dimension, score]) => ({
      dimension,
      score
    })),
    xField: 'dimension',
    yField: 'score',
    meta: {
      score: {
        min: 0,
        max: 100
      }
    },
    area: {
      style: {
        fillOpacity: 0.3
      }
    }
  };

  return (
    <StyledLayout>
      <PrintableContent ref={componentRef}>
        <Row>
          <Col span={24}>
            <Space style={{ marginBottom: 24 }}>
              <Button icon={<HomeOutlined />} onClick={() => navigate('/home')}>
                返回主页
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportPDF}>
                导出PDF
              </Button>
            </Space>

            <ReportTitle level={2}>学生综合能力评估报告</ReportTitle>

            {/* 天赋分析 */}
            <TalentAnalysis
              talentAnalysisData={talentAnalysisData}
              elementAnalysisData={elementAnalysisData}
              dimensionScores={dimensionScores}
              dimensions={dimensions}
            />

            {/* 双刃剑分析 */}
        <ReportCard title="性格特征双刃剑分析">
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
                    dataSource={[
                      { trait: '好强心理', positive: '追求卓越', negative: '容易产生挫败感' },
                      { trait: '创新思维', positive: '思维活跃', negative: '注意力容易分散' }
                    ]}
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
                children: '潜在特征内容'
              }
            ]}
          />
        </ReportCard>

        {/* 课堂表现分析 */}
        <ReportCard title="课堂表现分析">
          <Row gutter={24}>
            {['专注度', '参与度', '理解力', '表达力', '合作性', '自主性', '创造力'].map(item => (
              <Col span={8} key={item}>
                <Card title={item} bordered={false}>
                  <Progress
                    type="circle"
                    percent={Math.floor(Math.random() * 30) + 70}
                    format={percent => `${percent}分`}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </ReportCard>

        {/* 年龄段特定内容 */}
        <ReportCard title="年龄段个性化分析">
          <Collapse>
            <Panel header="焦虑问题及解决方案" key="1">
              <List
                dataSource={[
                  {
                    title: '学业压力',
                    solutions: [
                      '制定合理的学习计划',
                      '培养良好的学习习惯',
                      '适当的运动放松'
                    ]
                  },
                  {
                    title: '人际关系',
                    solutions: [
                      '参加团体活动',
                      '提升沟通技巧',
                      '建立自信心'
                    ]
                  }
                ]}
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
              {/* 学习障碍内容 */}
            </Panel>
            <Panel header="能力建设建议" key="3">
              {/* 能力建设内容 */}
            </Panel>
          </Collapse>
        </ReportCard>

        {/* 建议总结 */}
        <ReportCard title="发展建议总结" className="page-break">
          <Paragraph>
            根据以上分析，我们建议：
            <ul>
              <li>充分发挥人际交往能力，参与更多团队活动</li>
              <li>注意力训练，提高学习效率</li>
              <li>平衡个人发展，建立健康的学习心态</li>
            </ul>
          </Paragraph>
        </ReportCard>

        {/* 添加报告说明 */}
        <Card className="no-print">
          <Text type="secondary">
            注：本报告基于学生问答和行为数据分析生成，仅供参考。建议结合专业教师意见和实际情况使用。
          </Text>
        </Card>
          </Col>
        </Row>
      </PrintableContent>

      {/* 咨询专家按钮 */}
      <div style={{ marginTop: '40px' }} className="no-print">
        <Row justify="center">
          <Space size="large">
            <Button type="primary" size="large">
              咨询专家解读
            </Button>
            <Button size="large">
              分享报告
            </Button>
          </Space>
        </Row>
      </div>
    </StyledLayout>
  );
  
}

export default ReportPage;