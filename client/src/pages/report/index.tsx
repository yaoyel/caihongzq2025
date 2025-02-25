import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Layout, Typography, Card, Row, Col, Collapse, Tabs, List, Button, message, Space, Alert, Tag, Tooltip, Spin, Empty, Modal, Divider, Radio } from 'antd';
import styled from '@emotion/styled';
import { HomeOutlined, DownloadOutlined, QuestionCircleOutlined, BulbOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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

// 修改 DoubleEdgedInfo 接口定义
interface DoubleEdgedInfo {
  id: number;
  name: string;
  demonstrate: string;
  affect: string;
  likeElement: {
    id: number;
    name: string;
    status: string;
    double_edged_id: number;
  };
  talentElement: {
    id: number;
    name: string;
    status: string;
    double_edged_id: number;
  };
}

// 添加新的类型定义
interface DoubleEdgedScale {
  id: number;
  dimension: string;
  content: string;
  type: 'inner_state' | 'associate_with_people' | 'tackle_issues' | 'face_choices' | 'common_outcome' | 'normal_state';
}

// 修改样式组件
const StyledPanel = styled(Panel)`
  .ant-collapse-header {
    display: flex;
    align-items: center;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .confirm-button {
    font-size: 12px;
    background: #fff7e6;
    border-color: #ffd591;
    color: #fa8c16;
    
    &:hover {
      background: #fff1d4;
      border-color: #ffc069;
      color: #d46b08;
    }
  }

  .trait-name {
    color: rgba(0, 0, 0, 0.85);
  }
`;

const ContentBox = styled.div`
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;

  .title {
    font-size: 15px;
    color: #1f1f1f;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .content {
    color: #595959;
    line-height: 1.6;
    padding-left: 24px;
  }
`;

const ElementsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
  
  .element-card {
    padding: 16px;
    
    .element-title {
      color: #8c8c8c;
      margin-bottom: 8px;
    }
    
    .element-content {
      display: inline-flex;
      flex-direction: column;
      gap: 8px;
      
      .text-content {
        display: inline-block;
        background: #f5f5f5;
        padding: 4px 8px;
        border-radius: 4px;
      }
    }
  }
`;

// 添加新的样式组件
const StyledModal = styled(Modal)`
  .ant-modal-body {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
  }
`;

const QuestionCard = styled(Card)`
  margin: 16px 0;
  border-radius: 8px;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .ant-radio-group {
    width: 100%;
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

  // 在 ReportPage 组件中添加这些函数
  const handleConfirm = async (doubleEdgedId: number) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        message.error('请先登录');
        return;
      }

      const user = JSON.parse(userStr);
      setCurrentDoubleEdgedId(doubleEdgedId);

      // 修改 API 请求格式
      const answersResponse = await axios.get(
        getApiUrl(`/double-edged-answers/findByDoubleEdgedIdAndUserId?doubleEdgedId=${doubleEdgedId}&userId=${user.id}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // 获取量表数据
      const scaleResponse = await axios.get(
        getApiUrl(`/double-edged-scale/double-edged/${doubleEdgedId}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // 设置量表数据
      setScaleData(scaleResponse.data);

      // 如果有已存在的答案，设置到状态中
      if (answersResponse.data && answersResponse.data.length > 0) {
        const existingAnswers = answersResponse.data.reduce((acc: Record<number, number>, answer: any) => {
          acc[answer.scaleId] = answer.score;
          return acc;
        }, {});
        setScaleAnswers(existingAnswers);
      } else {
        // 如果没有答案，清空之前的答案
        setScaleAnswers({});
      }

      // 如果没有统计数据，先获取
      if (Object.keys(answerStats).length === 0) {
        await fetchAnswerStats();
      }

      const stats = answerStats[doubleEdgedId] || { completed: 0, total: 6 };
      message.info(`已完成 ${stats.completed}/${stats.total} 个确认题`);

      setModalVisible(true);
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    }
  };

  const handleAnswer = (scaleId: number, value: number) => {
    setScaleAnswers(prev => ({
      ...prev,
      [scaleId]: value
    }));
  };

  // 获取用户ID的函数（如果还没有的话）
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

  const [doubleEdgedData, setDoubleEdgedData] = useState<DoubleEdgedInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('请先登录');
          return;
        }

        // 获取有喜欢有天赋的元素
        const likeAndTalentElements = elementAnalysis.filter(item => 
          item.category === '有喜欢有天赋'
        );

        // 获取所有双刃剑数据
        const response = await axios.get(getApiUrl('/double-edged-info/all'), {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 过滤出与有喜欢有天赋元素相关的双刃剑数据
        const filteredData = response.data.filter((item: DoubleEdgedInfo) => 
          likeAndTalentElements.some((element: any) => 
            element.double_edged_id && element.double_edged_id === item.id
          )
        );

        setDoubleEdgedData(filteredData);
      } catch (error) {
        console.error('获取双刃剑数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    if (elementAnalysis.length > 0) {
      fetchData();
    }
  }, [elementAnalysis]);

  // 在 ReportPage 组件中添加状态
  const [modalVisible, setModalVisible] = useState(false);
  const [scaleData, setScaleData] = useState<DoubleEdgedScale[]>([]);
  const [scaleAnswers, setScaleAnswers] = useState<Record<number, number>>({});
  const [currentDoubleEdgedId, setCurrentDoubleEdgedId] = useState<number | null>(null);

  // 添加保存答案的函数
  const saveScaleAnswers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        return false;
      }

      const userId = getUserId();
      if (!userId) return false;

      const answers = Object.entries(scaleAnswers).map(([scaleId, score]) => ({
        userId,
        scaleId: parseInt(scaleId),
        score,
        doubleEdgedId: currentDoubleEdgedId
      }));

      await axios.post(
        getApiUrl('/double-edged-scale/answers'),
        { answers },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return true;
    } catch (error) {
      console.error('保存答案失败:', error);
      message.error('保存答案失败');
      return false;
    }
  };

  // 修改弹出框组件
  const renderModal = () => (
    <StyledModal
      title="深度确认"
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      width={800}
      footer={[
        <Button key="cancel" onClick={() => setModalVisible(false)}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={async () => {
            const success = await saveScaleAnswers();
            if (success) {
              message.success('提交成功');
              setModalVisible(false);
              setScaleAnswers({});  // 清空答案
            }
          }}
        >
          确认提交
        </Button>
      ]}
    >
      <Alert
        type="info"
        message="请根据实际情况选择最符合的选项"
        style={{ marginBottom: 24 }}
      />
      
      {scaleData.map((scale) => (
        <QuestionCard key={scale.id}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>{scale.content}</Text>
            <Divider />
            <Radio.Group
              onChange={(e) => handleAnswer(scale.id, e.target.value)}
              value={scaleAnswers[scale.id]}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value={1}>非常符合</Radio>
                <Radio value={2}>比较符合</Radio>
                <Radio value={3}>一般</Radio>
                <Radio value={4}>不太符合</Radio>
                <Radio value={5}>完全不符合</Radio>
              </Space>
            </Radio.Group>
          </Space>
        </QuestionCard>
      ))}
    </StyledModal>
  );

  // 添加新的状态
  const [answerStats, setAnswerStats] = useState<Record<number, { completed: number, total: number }>>({});

  // 添加获取答题统计的函数
  const fetchAnswerStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        message.error('请先登录');
        return;
      }

      const user = JSON.parse(userStr);
      const response = await axios.get(
        getApiUrl(`/double-edged-answers/findByUserId?userId=${user.id}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // 统计每个双刃剑的答题情况
      const stats = response.data.reduce((acc: Record<number, { completed: number, total: number }>, answer: any) => {
        if (!acc[answer.doubleEdgedId]) {
          acc[answer.doubleEdgedId] = { completed: 0, total: 6 };
        }
        acc[answer.doubleEdgedId].completed += 1;
        return acc;
      }, {});

      setAnswerStats(stats);
    } catch (error) {
      console.error('获取答题统计失败:', error);
    }
  };

  // 在组件初始化时获取答题统计
  useEffect(() => {
    fetchAnswerStats();
  }, []);

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
                description="这些特征是基于您的喜好和天赋组合分析得出的，了解这些特征有助于扬长避短，更好地发展。"
                style={{ marginBottom: 24 }}
              />
              
              <Spin spinning={loading}>
                <Collapse defaultActiveKey={[]}>
                  {doubleEdgedData.map((item) => (
                    <StyledPanel
                      key={item.id}
                      header={
                        <div className="header-content">
                          <span className="trait-name">
                            双刃剑名称: <strong>{item.name}</strong>
                          </span>
                          <Space>
                            <Tooltip title="点击进行深度确认，帮助您更好地理解和应对这些特征">
                              <Button 
                                size="small"
                                className="confirm-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirm(item.id);
                                }}
                              >
                                深度确认
                              </Button>
                            </Tooltip>
                            <Text type="secondary">
                              ({answerStats[item.id]?.completed || 0}/6)
                            </Text>
                          </Space>
                        </div>
                      }
                    >
                      <ContentBox>
                        <div className="title">
                          <BulbOutlined style={{ color: '#1890ff' }} />
                          <Text strong>表现特征</Text>
                        </div>
                        <div className="content">
                          {item.demonstrate}
                        </div>
                      </ContentBox>

                      <ContentBox>
                        <div className="title">
                          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                          <Text strong>影响分析</Text>
                        </div>
                        <div className="content">
                          {item.affect}
                        </div>
                      </ContentBox>

                      <ElementsGrid>
                        <div className="element-card">
                          <div className="element-title">关联喜欢</div>
                          <div className="element-content">
                            <Tag color="green">{item.likeElement.name}</Tag>
                            <span className="text-content">{item.likeElement.status}</span>
                          </div>
                        </div>
                        <div className="element-card">
                          <div className="element-title">关联天赋</div>
                          <div className="element-content">
                            <Tag color="purple">{item.talentElement.name}</Tag>
                            <span className="text-content">{item.talentElement.status}</span>
                          </div>
                        </div>
                      </ElementsGrid>
                    </StyledPanel>
                  ))}
                </Collapse>
                
                {!loading && doubleEdgedData.length === 0 && (
                  <Empty description="暂无相关的双刃剑特征数据" />
                )}
              </Spin>
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

      {renderModal()}
    </StyledLayout>
  );
}

export default ReportPage;