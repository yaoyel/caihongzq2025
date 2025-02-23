import React, { useRef, useEffect, useCallback } from 'react';
import { Layout, Typography, Card, Row, Col, Collapse, Tabs, Progress, List, Button, message, Space, Alert, Tag, Tooltip } from 'antd';
import styled from '@emotion/styled';
import { HomeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { getApiUrl } from '../../config';
import { useDispatch, useSelector } from 'react-redux';
import { setElementAnalysis } from '../../store/slices/reportSlice';
import { RootState } from '../../store';

// 子组件
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

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const componentRef = useRef<HTMLDivElement>(null);
  
  // 添加维度排序函数
  const sortByDimension = (a: any, b: any) => {
    const dimensionOrder = ['看', '听', '说', '记', '想', '做', '运动'];
    return dimensionOrder.indexOf(a.dimension) - dimensionOrder.indexOf(b.dimension);
  };

  const elementAnalysis = useSelector((state: RootState) => state.report.elementAnalysis);

  const fetchData = useCallback(async () => {
    try {
      const [scaleResponse, elementResponse] = await Promise.all([
        axios.get(getApiUrl('/scales/answers/user/1/summary')),
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

      dispatch(setElementAnalysis(elementResponse.data));


    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // 暂时注释掉未使用的配置
  /*const radarConfig = {
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
  };*/

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

            <ReportCard title="喜欢与天赋分布">
              <Row gutter={24}>
                <Col span={24}>
                  <Tabs
                    defaultActiveKey="result"
                    items={[
                      {
                        key: 'result',
                        label: '按结果分组',
                        children: (
                          <Collapse defaultActiveKey={[]}>
                            <Panel header="有喜欢有天赋" key="1">
                              <List
                                grid={{ gutter: 16, column: 4 }}
                                dataSource={elementAnalysis.filter(item => item.hasInterest && item.hasTalent).sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <Tooltip title={`${item.dimension}：${item.like_element || '暂无'}/${item.talent_element || '暂无'}`}>
                                      <Card title={item.dimension} size="small">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                          <div>
                                            <Text type="secondary">喜欢：</Text>
                                            <Tooltip title={item.like_status}>
                                              <Text>{item.like_element}</Text>
                                            </Tooltip>
                                          </div>
                                          <div>
                                            <Text type="secondary">天赋：</Text>
                                            <Tooltip title={item.talent_status}>
                                              <Text>{item.talent_element}</Text>
                                            </Tooltip>
                                          </div>
                                          <Space>
                                            <Tooltip title={item.like_status}>
                                              <Tag color="green">喜欢</Tag>
                                            </Tooltip>
                                            <Tooltip title={item.talent_status}>
                                              <Tag color="blue">有天赋</Tag>
                                            </Tooltip>
                                          </Space>
                                        </Space>
                                      </Card>
                                    </Tooltip>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel header="有喜欢没天赋" key="2">
                              <List
                                grid={{ gutter: 16, column: 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '有喜欢没天赋').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <Card title={item.dimension} size="small">
                                      <Space direction="vertical" style={{ width: '100%' }}>
                                        <div>
                                          <Text type="secondary">喜欢：</Text>
                                          <Tooltip title={item.like_status}>
                                            <Text>{item.like_element}</Text>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Tooltip title={item.talent_status}>
                                            <Text>{item.talent_element}</Text>
                                          </Tooltip>
                                        </div>
                                        <Space>
                                          <Tag color="green">有喜欢</Tag>
                                          <Tag color="default">无天赋</Tag>
                                        </Space>
                                      </Space>
                                    </Card>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel header="有天赋没喜欢" key="3">
                              <List
                                grid={{ gutter: 16, column: 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '有天赋没喜欢').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <Tooltip title={item.status}>
                                      <Card title={item.dimension} size="small">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                        <div>
                                          <Text type="secondary">喜欢：</Text>
                                          <Text>{item.like_element}</Text>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Text>{item.talent_element}</Text>
                                        </div>
                                        <Space>
                                          <Tag color="default">无喜欢</Tag>
                                          <Tooltip title={item.talent_element}>
                                            <Tag color="blue">有天赋</Tag>
                                          </Tooltip>
                                        </Space>
                                      </Space>
                                      </Card>
                                    </Tooltip>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel header="没喜欢没天赋" key="4">
                              <List
                                grid={{ gutter: 16, column: 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '没喜欢没天赋').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <Tooltip title={item.status}>
                                      <Card title={item.dimension} size="small">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                        <div>
                                          <Text type="secondary">喜欢：</Text>
                                          <Text>{item.like_element}</Text>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Text>{item.talent_element}</Text>
                                        </div>
                                        <Space>
                                          <Tag color="default">无兴趣</Tag>
                                          <Tag color="default">无天赋</Tag>
                                        </Space>
                                      </Space>
                                      </Card>
                                    </Tooltip>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel header="待确认" key="5">
                              <List
                                grid={{ gutter: 16, column: 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '待确认').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <Card title={item.dimension} size="small">
                                      <Space direction="vertical">
                                        <Space>
                                          <Tag color="warning">待确认</Tag>
                                        </Space>
                                        <div>
                                          <Text type="secondary">喜欢：</Text>
                                          <Tooltip title={item.like_status}>
                                            <Text>{item.like_element}</Text>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Tooltip title={item.talent_status}>
                                            <Text>{item.talent_element}</Text>
                                          </Tooltip>
                                        </div>
                                      </Space>
                                    </Card>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                          </Collapse>
                        )
                      },
                      {
                        key: 'dimension',
                        label: '按维度分组',
                        children: (
                          <Collapse defaultActiveKey={[]}>
                            {['看', '听', '说', '记', '想', '做', '运动'].map(dimension => (
                              <Panel header={dimension} key={dimension}>
                                <List
                                  grid={{ gutter: 16, column: 4 }}
                                  dataSource={elementAnalysis.filter(item => item.dimension === dimension)}
                                  renderItem={item => (
                                    <List.Item>
                                      <Card title={item.category} size="small">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                          <div>
                                            <Text type="secondary">喜欢：</Text>
                                            <Tooltip title={item.like_status}>
                                              <Text>{item.like_element}</Text>
                                            </Tooltip>
                                          </div>
                                          <div>
                                            <Text type="secondary">天赋：</Text>
                                            <Tooltip title={item.talent_status}>
                                              <Text>{item.talent_element}</Text>
                                            </Tooltip>
                                          </div>
                                          <Space>
                                            <Tooltip title={item.like_status}>
                                              <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                                {item.category.includes('有喜欢') ? '喜欢' : '无喜欢'}
                                              </Tag>
                                            </Tooltip>
                                            <Tooltip title={item.talent_status}>
                                              <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                                {item.category.includes('有天赋') ? '有天赋' : '无天赋'}
                                              </Tag>
                                            </Tooltip>
                                          </Space>
                                        </Space>
                                      </Card>
                                    </List.Item>
                                  )}
                                />
                              </Panel>
                            ))}
                          </Collapse>
                        )
                      },
                      {
                        key: 'type',
                        label: '按类型分组',
                        children: (
                          <Tabs
                            items={[
                              {
                                key: 'like',
                                label: '喜欢',
                                children: (
                                  <List
                                    grid={{ gutter: 16, column: 4 }}
                                    dataSource={[...elementAnalysis].sort(sortByDimension)}
                                    renderItem={item => (
                                      <List.Item>
                                        <Card title={item.dimension} size="small">
                                          <Space direction="vertical" style={{ width: '100%' }}>
                                            <div>
                                              <Text type="secondary">喜欢：</Text>
                                              <Tooltip title={item.like_status}>
                                                <Text>{item.like_element}</Text>
                                              </Tooltip>
                                            </div>
                                            <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                              {item.category.includes('有喜欢') ? '喜欢' : '无喜欢'}
                                            </Tag>
                                          </Space>
                                        </Card>
                                      </List.Item>
                                    )}
                                  />
                                )
                              },
                              {
                                key: 'talent',
                                label: '天赋',
                                children: (
                                  <List
                                    grid={{ gutter: 16, column: 4 }}
                                    dataSource={[...elementAnalysis].sort(sortByDimension)}
                                    renderItem={item => (
                                      <List.Item>
                                        <Card title={item.dimension} size="small">
                                          <Space direction="vertical" style={{ width: '100%' }}>
                                            <div>
                                              <Text type="secondary">天赋：</Text>
                                              <Tooltip title={item.talent_status}>
                                                <Text>{item.talent_element}</Text>
                                              </Tooltip>
                                            </div>
                                            <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                              {item.category.includes('有天赋') ? '有天赋' : '无天赋'}
                                            </Tag>
                                          </Space>
                                        </Card>
                                      </List.Item>
                                    )}
                                  />
                                )
                              }
                            ]}
                          />
                        )
                      }
                    ]}
                  />
                </Col>
              </Row>
            </ReportCard>

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

            <Card className="no-print">
              <Text type="secondary">
                注：本报告基于学生问答和行为数据分析生成，仅供参考。建议结合专业教师意见和实际情况使用。
              </Text>
            </Card>
          </Col>
        </Row>
      </PrintableContent>

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