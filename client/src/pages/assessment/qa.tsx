import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Button, Steps, Space, Progress, Menu, message, Tooltip } from 'antd';
import type { MenuItemProps } from 'antd';
import styled from '@emotion/styled';
import { ArrowLeftOutlined, ArrowRightOutlined, SendOutlined, HomeOutlined, CheckCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import axios from 'axios';
import { getApiUrl } from '../../config';

const { Title, Paragraph, Text } = Typography;
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

const QuestionCard = styled(Card)`
  margin: 16px 0;
  border-radius: 8px;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const StyledMenuItem = styled(Menu.Item as React.FC<MenuItemProps>)`
  padding: 12px 16px !important;
  min-height: 80px;
  position: relative;
  margin: 4px 8px !important;
  border-radius: 8px;
  
  .ant-menu-title-content {
    white-space: normal;
    line-height: 1.5;
    padding-right: 24px;
    width: 100%;
    
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
      width: calc(100% - 24px);
    }
    
    .answer-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      margin-top: 4px;
      word-break: break-all;
      width: calc(100% - 24px);
    }
  }

  .ant-menu-item-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
  }
`;

const StyledSubMenu = styled(Menu.SubMenu)`
  .ant-menu-sub {
    background: #fafafa !important;
  }
  
  .ant-menu-item {
    margin: 4px 0 !important;
  }
`;

interface Question {
  id: number;
  content: string;
  ageRange: '4-8' | '9-14' | '14+';
}

interface Answer {
  questionId: number;
  content: string;
  submittedAt: string;
}

interface AnswerSummary {
  total: number;
  completed: number;
  answers: Answer[];
}

const QAAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnswerSummary | null>(null);
  const [ageRange] = useState<'4-8' | '9-14' | '14+'>('4-8');

  useEffect(() => {
    fetchQuestions();
    fetchAnswerSummary();
  }, []);

  useEffect(() => {
    if (summary?.answers) {
      const savedAnswers = summary.answers.reduce((acc, answer) => ({
        ...acc,
        [answer.questionId]: answer.content
      }), {});
      setAnswers(prev => ({ ...prev, ...savedAnswers }));
      
      // 如果编辑器已经创建，设置当前问题的答案
      if (editor && questions[currentQuestion]) {
        const currentQuestionId = questions[currentQuestion].id;
        const savedAnswer = summary.answers.find(a => a.questionId === currentQuestionId);
        if (savedAnswer) {
          editor.setHtml(savedAnswer.content);
        } else {
          editor.setHtml('');
        }
      }
    }
  }, [summary, currentQuestion, questions, editor]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(getApiUrl('/questions'), {
        params: { ageRange }
      });
      setQuestions(response.data);
    } catch (error) {
      console.error('获取题目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswerSummary = async () => {
    try {
      const response = await axios.get(getApiUrl('/questions/answers/user/1/summary'), {
        params: { ageRange }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('获取答题进度失败:', error);
    }
  };

  const handleAnswer = (editor: IDomEditor) => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const currentQuestionId = questions[currentQuestion].id;
    
    // 只有当内容真正改变时才更新状态
    const plainText = html.replace(/<[^>]+>/g, '').trim();
    if (plainText || html !== answers[currentQuestionId]) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionId]: html
      }));
    }
  };

  const handleSubmit = async () => {
    if (!editor) return;
    
    const currentQuestionId = questions[currentQuestion].id;
    const content = editor.getHtml();
    const plainText = content?.replace(/<[^>]*>/g, '').trim();
    
    if (!plainText) {
      message.warning('请输入答案');
      return;
    }

    try {
      await axios.post(getApiUrl(`/questions/${currentQuestionId}/answers`), {
        userId: 1,
        content,
        submittedBy: '用户名',
        ageRange
      });
      
      message.success('保存成功');
      fetchAnswerSummary();
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
    } catch (error) {
      console.error('保存答案失败:', error);
      message.error('保存失败');
    }
  };

  const handleSelectQuestion = (questionId: number) => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index !== -1) {
      setCurrentQuestion(index);
    }
  };

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入你的答案...',
    MENU_CONF: {},
    onCreated: (editor: IDomEditor) => {
      setEditor(editor);
      // 在编辑器创建后设置初始答案
      if (questions[currentQuestion]) {
        const currentQuestionId = questions[currentQuestion].id;
        const savedAnswer = summary?.answers?.find(a => a.questionId === currentQuestionId);
        if (savedAnswer) {
          editor.setHtml(savedAnswer.content);
        }
      }
    }
  };

  const getNextUnansweredQuestion = () => {
    if (!summary?.answers || !questions.length) return -1;
    
    const answeredQuestionIds = new Set(summary.answers.map(a => a.questionId));
    const nextUnansweredIndex = questions.findIndex(q => !answeredQuestionIds.has(q.id));
    return nextUnansweredIndex;
  };

  const handleContinueAnswering = () => {
    const nextIndex = getNextUnansweredQuestion();
    if (nextIndex !== -1) {
      setCurrentQuestion(nextIndex);
    }
  };

  if (loading) return null;

  const progress = summary ? (summary.completed / summary.total * 100) : 0;

  const getStageQuestions = (stageIndex: number) => {
    const startIndex = stageIndex * 12;
    const endIndex = startIndex + 12;
    return questions.slice(startIndex, endIndex);
  };

  return (
    <StyledLayout>
      <Sider width={320} style={{ background: '#fff', padding: '24px 0' }}>
        <div style={{ padding: '0 24px', marginBottom: 16 }}>
          <Progress
            percent={Math.round(progress)}
            format={percent => `已完成 ${percent}%`}
          />
          {summary && summary.completed < summary.total && (
            <Tooltip title="继续上次的答题进度">
              <Button 
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleContinueAnswering}
                style={{ marginTop: 16, width: '100%' }}
              >
                继续答题
              </Button>
            </Tooltip>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[questions[currentQuestion]?.id.toString()]}
          defaultOpenKeys={[]}
          style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}
        >
          {['兴趣探索', '能力认知', '天赋发现'].map((stage, stageIndex) => (
            <StyledSubMenu
              key={`stage-${stageIndex}`}
              title={`${stage} (${stageIndex * 12 + 1}-${(stageIndex + 1) * 12}题)`}
            >
              {getStageQuestions(stageIndex).map((question, index) => {
                const answer = summary?.answers.find(a => a.questionId === question.id);
                const globalIndex = stageIndex * 12 + index;
                return (
                  <StyledMenuItem
                    key={question.id}
                    onClick={() => handleSelectQuestion(question.id)}
                    icon={answer ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong style={{ fontSize: '13px' }}>问题 {globalIndex + 1}</Text>
                      <Text type="secondary" className="question-preview">
                        {question.content}
                      </Text>
                      {answer && (
                        <Text type="secondary" className="answer-preview">
                          答：{answer.content}
                        </Text>
                      )}
                    </Space>
                  </StyledMenuItem>
                );
              })}
            </StyledSubMenu>
          ))}
        </Menu>
      </Sider>

      <StyledContent>
        <Button 
          icon={<HomeOutlined />} 
          onClick={() => navigate('/home')}
          style={{ marginBottom: '20px' }}
        >
          返回主页
        </Button>

        <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
          天赋问答测评
        </Title>

        <Steps
          current={Math.floor(currentQuestion / 12)}
          items={[
            { title: '兴趣探索', description: '1-12题' },
            { title: '能力认知', description: '13-24题' },
            { title: '天赋发现', description: '25-36题' }
          ]}
          style={{ marginBottom: 40 }}
        />

        <QuestionCard
          title={`Q${currentQuestion + 1}/${questions.length}`}
        >
          <Paragraph style={{ fontSize: '18px', marginBottom: 24 }}>
            {questions[currentQuestion].content}
          </Paragraph>
          
          <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px' }}>
            <Toolbar
              editor={editor}
              defaultConfig={{}}
              mode="default"
              style={{ borderBottom: '1px solid #f0f0f0' }}
            />
            <Editor
              defaultConfig={editorConfig}
              value={answers[questions[currentQuestion].id] || ''}
              onCreated={setEditor}
              onChange={handleAnswer}
              mode="default"
              style={{ height: '300px', overflowY: 'hidden' }}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space size="large">
              {currentQuestion > 0 && (
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                >
                  上一题
                </Button>
              )}
              <Button 
                type="primary"
                icon={currentQuestion < questions.length - 1 ? <ArrowRightOutlined /> : <SendOutlined />}
                onClick={handleSubmit}
              >
                {currentQuestion < questions.length - 1 ? '保存并继续' : '完成'}
              </Button>
            </Space>
          </div>
        </QuestionCard>
      </StyledContent>
    </StyledLayout>
  );
};

export default QAAssessment;