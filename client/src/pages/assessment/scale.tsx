import React, { useState, useEffect } from 'react';
import { Layout, Typography, Steps, Card, Radio, Progress, Space, Button, Divider, Menu, message } from 'antd';
import type { MenuItemProps } from 'antd';
import styled from '@emotion/styled';
import { ArrowRightOutlined, ArrowLeftOutlined, HomeOutlined, CheckCircleOutlined, CaretRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: #f5f5f5;
`;

const StyledContent = styled(Content)`
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

const QuestionCard = styled(Card)`
  margin: 16px 0;
  border-radius: 8px;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const StyledMenuItem = styled(Menu.Item as React.FC<MenuItemProps>)`
  padding: 12px 24px !important;
  min-height: 80px;
  position: relative;
  margin: 4px 0 !important;
  
  .ant-menu-title-content {
    white-space: normal;
    line-height: 1.5;
    padding-right: 32px;
    
    .question-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 4px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);
      word-break: break-all;
    }
    
    .answer-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      margin-top: 4px;
      padding-right: 24px;
      word-break: break-all;
    }
  }

  .ant-menu-item-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
  }

  &:hover {
    .question-preview, .answer-preview {
      color: inherit;
    }
  }
`;

const StyledSubMenu = styled(Menu.SubMenu)`
  .ant-menu-sub {
    background: #fafafa !important;
  }
  
  .ant-menu-item {
    margin: 0 !important;
  }

  .ant-menu-submenu-title {
    font-weight: bold;
    height: auto !important;
    padding: 12px 24px !important;
    
    .ant-progress {
      margin-top: 8px;
    }
  }
`;

const sections = [
  { title: '兴趣偏好（正向）', type: 'like', direction: 'positive', color: '#52c41a' },
  { title: '天赋特质（正向）', type: 'talent', direction: 'positive', color: '#1890ff' },
  { title: '兴趣偏好（反向）', type: 'like', direction: 'negative', color: '#faad14' },
  { title: '天赋特征（反向）', type: 'talent', direction: 'negative', color: '#722ed1' }
];

interface Scale {
  id: number;
  content: string;
  type: 'like' | 'talent';
  direction: 'positive' | 'negative';
  dimension: '看' | '听' | '说' | '记' | '想' | '做' | '运动';
}

const ScaleAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [allQuestions, setAllQuestions] = useState<Scale[]>([]);
  const [questions, setQuestions] = useState<Scale[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [savedAnswers, setSavedAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchAllQuestions();
    fetchSavedAnswers();
  }, []);

  useEffect(() => {
    if (allQuestions.length > 0) {
      filterQuestionsBySection();
    }
  }, [currentSection, allQuestions]);

  const fetchAllQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl('/scales'));
      setAllQuestions(response.data);
    } catch (error) {
      console.error('获取题目失败:', error);
      message.error('获取题目失败');
    } finally {
      setLoading(false);
    }
  };

  const filterQuestionsBySection = () => {
    const section = sections[currentSection];
    const filteredQuestions = allQuestions.filter(
      q => q.type === section.type && q.direction === section.direction
    );
    setQuestions(filteredQuestions);
    setCurrentQuestion(0);
  };

  const fetchSavedAnswers = async () => {
    try {
      const response = await axios.get(getApiUrl('/scales/answers/user/1')); // TODO: 使用实际的用户ID
      const savedAnswersMap = response.data.reduce((acc: Record<number, number>, answer: any) => {
        acc[answer.scaleId] = answer.score;
        return acc;
      }, {});
      setSavedAnswers(savedAnswersMap);
      setAnswers(prev => ({...prev, ...savedAnswersMap}));
    } catch (error) {
      console.error('获取已保存答案失败:', error);
      message.error('获取已保存答案失败');
    }
  };

  const saveAnswer = async (questionId: number, score: number) => {
    try {
      await axios.post(getApiUrl(`/scales/${questionId}/answers`), {
        userId: 1, // TODO: 使用实际的用户ID
        score
      });
    } catch (error) {
      console.error('保存答案失败:', error);
    }
  };

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionData.id]: value
    }));
  };

  const handleNext = async () => {
    const currentAnswer = answers[currentQuestionData.id];
    
    if (!currentAnswer) return;
    
    await saveAnswer(currentQuestionData.id, currentAnswer);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const handleSelectQuestion = (questionId: number) => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index !== -1) {
      setCurrentQuestion(index);
    }
  };

  const handleComplete = async () => {
    const currentAnswer = answers[currentQuestionData.id];
    
    if (currentAnswer) {
      await saveAnswer(currentQuestionData.id, currentAnswer);
    }
    
    navigate('/report');
  };

  const findFirstUnansweredInSection = (sectionQuestions: Scale[]) => {
    return sectionQuestions.findIndex(q => !answers[q.id]);
  };

  const handleContinue = () => {
    for (let i = 0; i < sections.length; i++) {
      const sectionQuestions = allQuestions.filter(
        q => q.type === sections[i].type && q.direction === sections[i].direction
      );
      const unansweredIndex = findFirstUnansweredInSection(sectionQuestions);
      
      if (unansweredIndex !== -1) {
        setCurrentSection(i);
        setTimeout(() => {
          setCurrentQuestion(unansweredIndex);
        }, 0);
        return;
      }
    }
  };

  const getQuestionsForSection = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    return allQuestions.filter(
      q => q.type === section.type && q.direction === section.direction
    );
  };

  const getSectionProgress = (sectionIndex: number) => {
    const sectionQuestions = getQuestionsForSection(sectionIndex);
    const answeredCount = sectionQuestions.filter(q => answers[q.id]).length;
    return {
      total: sectionQuestions.length,
      completed: answeredCount,
      percent: sectionQuestions.length ? Math.round((answeredCount / sectionQuestions.length) * 100) : 0
    };
  };

  if (loading || allQuestions.length === 0) return null;

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = allQuestions.length;
  const progress = (totalAnswered / totalQuestions) * 100;
  const hasUnfinishedQuestions = progress < 100;

  if (questions.length === 0) return null;
  const currentQuestionIndex = Math.min(currentQuestion, questions.length - 1);
  const currentQuestionData = questions[currentQuestionIndex];

  return (
    <StyledLayout>
      <Sider width={300} style={{ background: '#fff', padding: '24px 0', height: '100vh', position: 'fixed', overflowY: 'auto', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '0 24px', marginBottom: 16 }}>
          <Progress
            percent={Math.round(progress)}
            format={percent => `总进度 ${percent}%`}
          />
          {hasUnfinishedQuestions && (
            <Button
              type="primary"
              block
              onClick={handleContinue}
              style={{ marginTop: 16 }}
            >
              继续答题
            </Button>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentQuestionData.id.toString()]}
          defaultOpenKeys={[]}
          style={{ borderRight: 'none' }}
        >
          {sections.map((section, sectionIndex) => {
            const sectionQuestions = getQuestionsForSection(sectionIndex);
            const sectionProgress = getSectionProgress(sectionIndex);
            
            return (
              <StyledSubMenu
                key={sectionIndex}
                title={
                  <div>
                    <div>{section.title}</div>
                    <Progress
                      percent={sectionProgress.percent}
                      size="small"
                      format={() => `${sectionProgress.completed}/${sectionProgress.total}`}
                      strokeColor={section.color}
                    />
                  </div>
                }
              >
                {sectionQuestions.map((question, index) => {
                  const answer = answers[question.id];
                  return (
                    <StyledMenuItem
                      key={question.id}
                      onClick={() => {
                        setCurrentSection(sectionIndex);
                        setCurrentQuestion(index);
                      }}
                      icon={answer ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{question.dimension} - 问题 {index + 1}</Text>
                        <Text type="secondary" className="question-preview">
                          {question.content}
                        </Text>
                        {answer && (
                          <Text type="secondary" className="answer-preview">
                            答：{answer === 5 ? '非常符合' : 
                                answer === 4 ? '比较符合' : 
                                answer === 3 ? '一般' : 
                                answer === 2 ? '不太符合' : '完全不符合'}
                          </Text>
                        )}
                      </Space>
                    </StyledMenuItem>
                  );
                })}
              </StyledSubMenu>
            );
          })}
        </Menu>
      </Sider>
      <Layout style={{ marginLeft: 300 }}>
        <StyledContent>
          <Button 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/home')}
            style={{ marginBottom: '20px' }}
          >
            返回主页
          </Button>

          <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
            天赋量表测评
          </Title>

          <Steps
            current={currentSection}
            items={sections.map(section => ({
              title: section.title,
              style: { whiteSpace: 'normal', height: 'auto', padding: '8px 0' }
            }))}
            style={{ marginBottom: 40 }}
          />

          <StyledCard
            title={
              <Space>
                <Text style={{ color: sections[currentSection].color }}>
                  {currentQuestionData.dimension}
                </Text>
                <Progress
                  percent={((currentQuestionIndex + 1) / questions.length) * 100}
                  format={() => `${currentQuestionIndex + 1}/${questions.length}`}
                  size="small"
                  style={{ width: 120 }}
                  strokeColor={sections[currentSection].color}
                />
              </Space>
            }
          >
            <QuestionCard>
              <Text style={{ fontSize: '16px' }}>
                {currentQuestionData.content}
              </Text>
              <Divider />
              <Radio.Group 
                onChange={e => handleAnswer(e.target.value)} 
                value={answers[currentQuestionData.id]}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio value={5}>非常符合</Radio>
                  <Radio value={4}>比较符合</Radio>
                  <Radio value={3}>一般</Radio>
                  <Radio value={2}>不太符合</Radio>
                  <Radio value={1}>完全不符合</Radio>
                </Space>
              </Radio.Group>

              <Divider />
              
              <div style={{ textAlign: 'center' }}>
                <Space size="large">
                  {(currentQuestionIndex > 0 || currentSection > 0) && (
                    <Button 
                      icon={<ArrowLeftOutlined />}
                      onClick={handlePrevious}
                      size="middle"
                    >
                      上一题
                    </Button>
                  )}
                  {currentQuestionIndex === questions.length - 1 && currentSection === sections.length - 1 ? (
                    <Button 
                      type="primary"
                      size="middle"
                      onClick={handleComplete}
                      disabled={!answers[currentQuestionData.id]}
                    >
                      完成
                    </Button>
                  ) : (
                    <Button 
                      type="primary"
                      icon={<ArrowRightOutlined />}
                      size="middle"
                      onClick={handleNext}
                      disabled={!answers[currentQuestionData.id]}
                    >
                      下一题
                    </Button>
                  )}
                </Space>
              </div>
            </QuestionCard>
          </StyledCard>
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default ScaleAssessment; 