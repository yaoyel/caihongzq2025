import React, { useState, useRef } from 'react';
import { Layout, Typography, Card, Row, Col, Collapse, Tabs, Progress, List, Tag, Button, Divider, message, Space, Tooltip, Alert } from 'antd';
import { Radar } from '@ant-design/plots';
import styled from '@emotion/styled';
import { HomeOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

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
  const [activeKey, setActiveKey] = useState(['1']);
  const componentRef = useRef<HTMLDivElement>(null);

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

  // 修改维度数据结构
  const dimensions = ['看', '听', '说', '记', '想', '做', '运动'];
  
  // 模拟用户答案数据，实际使用时需要从props或API获取
  const [talentAnalysis, setTalentAnalysis] = useState<TalentAnalysis[]>([]);

  // 分析天赋和兴趣
  const analyzeTalentAndInterest = (scaleAnswers: any) => {
    const analysis = dimensions.map(dim => {
      // 这里需要根据实际数据结构调整获取答案的方式
      const talentForward = scaleAnswers[`${dim}_talent_forward`] || 0;
      const talentReverse = scaleAnswers[`${dim}_talent_reverse`] || 0;
      const interestForward = scaleAnswers[`${dim}_interest_forward`] || 0;
      const interestReverse = scaleAnswers[`${dim}_interest_reverse`] || 0;

      const hasTalent = (talentForward <= 2 && talentReverse >= 3);
      const hasInterest = (interestForward <= 2 && interestReverse >= 3);

      return {
        dimension: dim,
        hasTalent,
        hasInterest
      };
    });

    setTalentAnalysis(analysis);
  };

  // 获取不同类别的维度
  const getTalentCategories = () => {
    const bothTalentAndInterest = talentAnalysis.filter(t => t.hasTalent && t.hasInterest);
    const neitherTalentNorInterest = talentAnalysis.filter(t => !t.hasTalent && !t.hasInterest);
    const onlyInterest = talentAnalysis.filter(t => !t.hasTalent && t.hasInterest);
    const onlyTalent = talentAnalysis.filter(t => t.hasTalent && !t.hasInterest);

    return {
      bothTalentAndInterest,
      neitherTalentNorInterest,
      onlyInterest,
      onlyTalent
    };
  };

  // 修改雷达图配置
  const radarConfig = {
    data: dimensions.map(dim => ({
      name: dim,
      value: Math.random() * 100 // 这里需要根据实际分析结果设置数值
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

  // 在天赋与喜好分析卡片中展示分类结果
  const renderTalentAnalysis = () => {
    const categories = getTalentCategories();
    
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {categories.bothTalentAndInterest.length > 0 && (
          <Card title="有天赋且感兴趣">
            {categories.bothTalentAndInterest.map(item => (
              <Tag color="success" key={item.dimension}>{item.dimension}</Tag>
            ))}
          </Card>
        )}
        
        {categories.neitherTalentNorInterest.length > 0 && (
          <Card title="既无天赋也无兴趣">
            {categories.neitherTalentNorInterest.map(item => (
              <Tag color="error" key={item.dimension}>{item.dimension}</Tag>
            ))}
          </Card>
        )}
        
        {categories.onlyInterest.length > 0 && (
          <Card title="有兴趣但暂无天赋">
            {categories.onlyInterest.map(item => (
              <Tag color="warning" key={item.dimension}>{item.dimension}</Tag>
            ))}
          </Card>
        )}
        
        {categories.onlyTalent.length > 0 && (
          <Card title="有天赋但缺乏兴趣">
            {categories.onlyTalent.map(item => (
              <Tag color="processing" key={item.dimension}>{item.dimension}</Tag>
            ))}
          </Card>
        )}
      </Space>
    );
  };

  // 添加雷达图事件的类型定义
  interface RadarEvent {
    data: {
      data: {
        name: string;
        value: number;
      }
    }
  }

  const handleExportPDF = () => {
    const element = componentRef.current;
    if (!element) return;

    const opt = {
      margin: 1,
      filename: '学生综合能力评估报告.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    message.loading('正在生成PDF...');
    html2pdf().set(opt).from(element).save().then(() => {
      message.success('PDF导出成功');
    });
  };

  return (
    <StyledLayout>
      {/* 操作按钮区 */}
      <Row justify="space-between" className="no-print">
        <Button icon={<HomeOutlined />} onClick={() => navigate('/home')}>
          返回主页
        </Button>
      </Row>

      <div ref={componentRef}>
        <ReportTitle level={2}>学生综合能力评估报告</ReportTitle>

        {/* 基本信息 */}
        <ReportCard title="基本信息">
          <Row gutter={24}>
            <Col span={8}>
              <Text strong>姓名：</Text> 张三
            </Col>
            <Col span={8}>
              <Text strong>年龄：</Text> 12岁
            </Col>
            <Col span={8}>
              <Text strong>年级：</Text> 初中一年级
            </Col>
          </Row>
        </ReportCard>

        {/* 天赋与喜好分析 */}
        <ReportCard title="天赋与喜好分析">
          <Collapse activeKey={activeKey} onChange={setActiveKey}>
            <Panel 
              header="天赋与喜好雷达图" 
              key="1"
              extra={
                <Tooltip title="点击雷达图各点可查看详细说明">
                  <InfoCircleOutlined />
                </Tooltip>
              }
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Radar {...radarConfig} onReady={(plot) => {
                    plot.on('element:click', (evt: RadarEvent) => {
                      const { name, value } = evt.data.data;
                      message.info(`${name}: ${value}分`);
                    });
                  }} />
                </Col>
                <Col span={12}>
                  {renderTalentAnalysis()}
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </ReportCard>

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
      </div>

      {/* 咨询专家按钮 */}
      <Row justify="center" style={{ marginTop: '40px' }} className="no-print">
        <Space size="large">
          <Button type="primary" size="large">
            咨询专家解读
          </Button>
          <Button size="large">
            分享报告
          </Button>
        </Space>
      </Row>
    </StyledLayout>
  );
};

export default ReportPage; 