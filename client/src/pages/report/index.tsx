import React, { useRef, useEffect, useCallback } from 'react';
import { Layout, Typography, Card, Row, Col, Collapse, Tabs, List, Button, message, Space, Alert, Tag, Tooltip } from 'antd';
import styled from '@emotion/styled';
import { HomeOutlined, DownloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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

// 添加课堂表现与元素ID的映射
const CLASSROOM_PERFORMANCE_ELEMENTS = {
  '看': {
    title: '看黑板板书（看）',
    elementIds: [4, 30, 32]
  },
  '听': {
    title: '听老师讲课（听）',
    elementIds: [5, 34, 36]
  },
  '说': {
    title: '积极回答问题（说）',
    elementIds: [10, 38]
  },
  '记': {
    title: '记忆老师授课内容（记）',
    elementIds: [15, 43]
  },
  '想': {
    title: '跟随老师提问思考（想）',
    elementIds: [19, 46, 47]
  },
  '做': {
    title: '完成作业（做）',
    elementIds: [21, 22, 51]
  },
  '运动': {
    title: '上好体育课（运动）',
    elementIds: [25, 26, 27, 28, 53, 54, 55, 56]
  }
};

// 添加提示内容配置
const CATEGORY_TIPS = {
  '有喜欢有天赋': (
    <div>
      <p>• 爸爸妈妈共识后放手，让孩子享受自我成就的快乐。当喜欢与天赋相结合，孩子会开心且自然而然做出好结果。</p>
      <p>• 爸爸妈妈夸赞孩子取得的好结果。</p>
      <p>• 要注意喜欢和天赋兼具点的双刃剑。</p>
    </div>
  ),
  '没喜欢没天赋': (
    <div>
      <p>• 爸爸妈妈懂得创新，让孩子体验克服困难、战胜挑战的快乐。</p>
      <p>• 爸爸妈妈夸赞孩子付出的努力。</p>
      <p>• 即便老师或家长耐心陪伴，孩子也可能很不情愿磨炼。此时，老师或家长可借助孩子喜欢与天赋兼具的点，为孩子创新发展方法。当孩子体验到逐渐做出好结果的乐趣，会慢慢提升付出意愿，不断积累克服困难、战胜挑战的能力与信心，坚持做出一定结果。</p>
    </div>
  ),
  '有天赋没喜欢': (
    <div>
      <p>• 爸爸妈妈精准鼓励，让孩子体验释放潜能的快乐。</p>
      <p>• 在喜欢不明显的维度，孩子不会自愿付出与投入。老师或家长在耐心陪伴时，要不断鼓励孩子发现天赋、体验天赋释放所带来的乐趣，这样孩子会慢慢提升付出意愿，持续做出好结果。</p>
      <p>• 爸爸妈妈夸赞孩子展现天赋的行为。</p>
    </div>
  ),
  '有喜欢没天赋': (
    <div>
      <p>• 爸爸妈妈在包容中等待，让孩子享受自我成长的快乐。</p>
      <p>• 爸爸妈妈要夸赞孩子的进步。</p>
      <p>• 在喜欢的方向上，哪怕欠缺天赋，孩子也会主动、经常投入，自觉自愿磨炼，慢慢地，也能逐渐做出好结果。</p>
    </div>
  )
};

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

  // 添加获取用户ID的函数
  const getUserId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      message.error('用户未登录');
      navigate('/login');
      return null;
    }
    const user = JSON.parse(userStr);
    return user.id;
  };

  const fetchData = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const [scaleResponse, elementResponse] = await Promise.all([
        axios.get(getApiUrl(`/scales/answers/user/${userId}/summary`), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        axios.get(getApiUrl(`/report/element-analysis/${userId}`), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
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
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
      } else {
        message.error('获取数据失败');
      }
    }
  }, [dispatch, navigate]);

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
                            <Panel 
                              header={
                                <Space>
                                  <Text strong>有喜欢有天赋</Text>
                                  <Tooltip title={CATEGORY_TIPS['有喜欢有天赋']} overlayStyle={{ maxWidth: '500px' }}>
                                    <QuestionCircleOutlined />
                                  </Tooltip>
                                </Space>
                              } 
                              key="1"
                            >
                              <List
                                grid={{ gutter: 16, column: 4 }}
                                dataSource={elementAnalysis
                                  .filter(item => item.category === '有喜欢有天赋')
                                  .sort(sortByDimension)
                                }
                                renderItem={item => (
                                  <List.Item>
                                    <Card title={item.dimension} size="small">
                                      <Space direction="vertical" style={{ width: '100%' }}>
                                        <div>
                                          <Text type="secondary">喜欢：</Text>
                                          <Tooltip title={item.like_status}>
                                            <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                              {item.like_element}
                                              {item.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Tooltip title={item.talent_status}>
                                            <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                              {item.talent_element}
                                              {item.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                      </Space>
                                    </Card>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel 
                              header={
                                <Space>
                                  <Text strong>有喜欢没天赋</Text>
                                  <Tooltip title={CATEGORY_TIPS['有喜欢没天赋']} overlayStyle={{ maxWidth: '500px' }}>
                                    <QuestionCircleOutlined />
                                  </Tooltip>
                                </Space>
                              } 
                              key="2"
                            >
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
                                            <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                              {item.like_element}
                                              {item.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Tooltip title={item.talent_status}>
                                            <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                              {item.talent_element}
                                              {item.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                      </Space>
                                    </Card>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel 
                              header={
                                <Space>
                                  <Text strong>有天赋没喜欢</Text>
                                  <Tooltip title={CATEGORY_TIPS['有天赋没喜欢']} overlayStyle={{ maxWidth: '500px' }}>
                                    <QuestionCircleOutlined />
                                  </Tooltip>
                                </Space>
                              } 
                              key="3"
                            >
                              <List
                                grid={{ gutter: 16, column: 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '有天赋没喜欢').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <Card title={item.dimension} size="small">
                                      <Space direction="vertical" style={{ width: '100%' }}>
                                        <div>
                                          <Text type="secondary">喜欢：</Text>
                                          <Tooltip title={item.like_status}>
                                            <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                              {item.like_element}
                                              {item.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Tooltip title={item.talent_status}>
                                            <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                              {item.talent_element}
                                              {item.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                      </Space>
                                    </Card>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel 
                              header={
                                <Space>
                                  <Text strong>没喜欢没天赋</Text>
                                  <Tooltip title={CATEGORY_TIPS['没喜欢没天赋']} overlayStyle={{ maxWidth: '500px' }}>
                                    <QuestionCircleOutlined />
                                  </Tooltip>
                                </Space>
                              } 
                              key="4"
                            >
                              <List
                                grid={{ gutter: 16, column: 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '没喜欢没天赋').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <Card title={item.dimension} size="small">
                                      <Space direction="vertical" style={{ width: '100%' }}>
                                        <div>
                                          <Text type="secondary">喜欢：</Text>
                                          <Tooltip title={item.like_status}>
                                            <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                              {item.like_element}
                                              {item.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Tooltip title={item.talent_status}>
                                            <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                              {item.talent_element}
                                              {item.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                      </Space>
                                    </Card>
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
                                      <Space direction="vertical" style={{ width: '100%' }}>
                                        <Space>
                                          <Tag color="warning">待确认</Tag>
                                        </Space>
                                        <div>
                                          <Text type="secondary">喜欢：</Text>
                                          <Tooltip title={item.like_status}>
                                            <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                              {item.like_element}
                                              {item.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                            </Tag>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Text type="secondary">天赋：</Text>
                                          <Tooltip title={item.talent_status}>
                                            <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                              {item.talent_element}
                                              {item.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                            </Tag>
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
                              <Panel 
                                header={dimension}
                                key={dimension}
                              >
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
                                              <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                                {item.like_element}
                                                {item.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                              </Tag>
                                            </Tooltip>
                                          </div>
                                          <div>
                                            <Text type="secondary">天赋：</Text>
                                            <Tooltip title={item.talent_status}>
                                              <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                                {item.talent_element}
                                                {item.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                              </Tag>
                                            </Tooltip>
                                          </div>
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
                                                <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                                  {item.like_element}
                                                  {item.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                                </Tag>
                                              </Tooltip>
                                            </div>
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
                                                <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                                  {item.talent_element}
                                                  {item.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                                </Tag>
                                              </Tooltip>
                                            </div>
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
                {Object.entries(CLASSROOM_PERFORMANCE_ELEMENTS).map(([dimension, config]) => {
                  const dimensionElements = elementAnalysis.filter(item => 
                    item.dimension === dimension && 
                    config.elementIds.includes(item.element_id)
                  );

                  return (
                    <Col span={8} key={dimension}>
                      <Card 
                        title={config.title} 
                        bordered={false}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary">喜欢：</Text>
                            <Space wrap>
                              {dimensionElements
                                .filter(element => element.like_status)
                                .map(element => (
                                  <Tooltip 
                                    key={element.element_id}
                                    title={element.like_status}
                                  >
                                    <Tag color={element.category.includes('有喜欢') ? 'green' : 'default'}>
                                      {element.like_element}
                                      {element.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                    </Tag>
                                  </Tooltip>
                                ))}
                            </Space>
                          </div>
                          <div>
                            <Text type="secondary">天赋：</Text>
                            <Space wrap>
                              {dimensionElements
                                .filter(element => element.talent_status)
                                .map(element => (
                                  <Tooltip 
                                    key={element.element_id}
                                    title={element.talent_status}
                                  >
                                    <Tag color={element.category.includes('有天赋') ? 'blue' : 'default'}>
                                      {element.talent_element}
                                      {element.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                    </Tag>
                                  </Tooltip>
                                ))}
                            </Space>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
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