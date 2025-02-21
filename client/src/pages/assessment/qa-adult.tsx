import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Button, Steps, Space, Progress, Menu, Badge, message } from 'antd';
import type { MenuItemProps } from 'antd';
import styled from '@emotion/styled';
import { ArrowLeftOutlined, ArrowRightOutlined, SendOutlined, HomeOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
  padding: 12px 24px !important;
  min-height: 80px;
  position: relative;
  
  .ant-menu-title-content {
    white-space: normal;
    line-height: 1.5;
    padding-right: 24px;
    
    .question-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 4px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);
    }
    
    .answer-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      margin-top: 4px;
    }
  }

  .ant-menu-item-icon {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
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

const AdultQAAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnswerSummary | null>(null);

  useEffect(() => {
    fetchQuestions();
    fetchAnswerSummary();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(getApiUrl('/questions'), {
        params: { ageRange: '14+' }
      });
      setQuestions(response.data);
    } catch (error) {
      console.error('获取题目失败:', error);
      message.error('获取题目失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswerSummary = async () => {
    try {
      const response = await axios.get(getApiUrl('/questions/answers/user/1/summary'), {
        params: { ageRange: '14+' }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('获取答题进度失败:', error);
      message.error('获取答题进度失败');
    }
  };

  const handleAnswer = (editor: IDomEditor) => {
    const html = editor.getHtml();
    const currentQuestionId = questions[currentQuestion].id;
    setAnswers(prev => ({
      ...prev,
      [currentQuestionId]: html
    }));
  };

  const handleSubmit = async () => {
    const currentQuestionId = questions[currentQuestion].id;
    const content = answers[currentQuestionId];
    
    // 移除 HTML 标签，检查实际内容
    const plainText = content?.replace(/<[^>]+>/g, '').trim();
    
    if (!plainText) {
      message.warning('请输入答案');
      return;
    }

    try {
      await axios.post(getApiUrl(`/questions/${currentQuestionId}/answers`), {
        userId: 1, // TODO: 使用实际的用户ID
        content,
        submittedBy: '用户名' // TODO: 使用实际的用户名
      });
      
      message.success('保存成功');
      fetchAnswerSummary();
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        // 清空编辑器内容
        if (editor) {
          editor.setHtml('');
        }
      } else {
        navigate('/report');
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
  if (loading) return null;

  const progress = summary ? (summary.completed / summary.total * 100) : 0;

  return (
    <StyledLayout>
      <Sider width={300} style={{ background: '#fff', padding: '24px 0' }}>
        <div style={{ padding: '0 24px', marginBottom: 16 }}>
          <Progress
            percent={Math.round(progress)}
            format={percent => `已完成 ${percent}%`}
          />
          {progress < 100 && (
            <Button
              type="primary"
              block
              onClick={() => {
                const nextUnanswered = questions.findIndex((q, idx) => !summary?.answers.find(a => a.questionId === q.id));
                if (nextUnanswered !== -1) {
                  setCurrentQuestion(nextUnanswered);
                }
              }}
              style={{ marginTop: 16 }}
            >
              继续答题
            </Button>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[questions[currentQuestion].id.toString()]}
          style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}
        >
          {questions.map((question, index) => {
            const answer = summary?.answers.find(a => a.questionId === question.id);
            return (
              <StyledMenuItem
                key={question.id}
                onClick={() => handleSelectQuestion(question.id)}
                icon={answer ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>问题 {index + 1}</Text>
                  <Text type="secondary" className="question-preview">
                    {question.content}
                  </Text>
                  {answer && (
                    <Text type="secondary" className="answer-preview">
                      答：{answer.content.replace(/<[^>]+>/g, '')}
                    </Text>
                  )}
                </Space>
              </StyledMenuItem>
            );
          })}
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
          成人天赋问答测评（14岁以上）
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

export default AdultQAAssessment;