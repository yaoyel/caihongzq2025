import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Steps,
  Card,
  Radio,
  Progress,
  Space,
  Button,
  Divider,
  Menu,
  message,
  Row,
  Tooltip,
} from 'antd';
import type { MenuItemProps } from 'antd';
import styled from '@emotion/styled';
import {
  HomeOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CheckOutlined,
  CloseOutlined,
  MenuOutlined,
} from '@ant-design/icons';
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

  @media (max-width: 768px) {
    padding: 16px;
    max-width: 100%;
  }
`;

const StyledSider = styled(Sider)<{ collapsed?: boolean }>`
  background: #fff;
  padding: 24px 0;
  height: 100vh;
  position: fixed;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 1px solid #f0f0f0;
  z-index: 1000;

  @media (max-width: 768px) {
    position: fixed;
    left: ${(props) => (props.collapsed ? '-300px' : '0')};
    transition: left 0.3s ease;
  }
`;

const StyledMainLayout = styled(Layout)<{ collapsed?: boolean }>`
  margin-left: 300px;
  transition: margin-left 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const ToggleButton = styled(Button)<{ $collapsed: boolean }>`
  position: fixed;
  left: 16px;
  top: 16px;
  z-index: 1001;
  display: none;
  background: transparent;
  border: none;
  box-shadow: none;
  color: #1890ff;
  padding: 0 12px;
  height: 48px;
  min-width: 48px;
  border-radius: 24px;
  justify-content: center;
  align-items: center;
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    background: #f0f5ff;
    color: #40a9ff;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: ${(props) => (props.$collapsed ? 'row' : 'column')};
    gap: 4px;
  }
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

const QuestionCard = styled(Card)`
  margin: 16px 0;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StyledMenuItem = styled(Menu.Item as React.FC<MenuItemProps>)`
  padding: 12px 24px !important;
  position: relative;
  margin: 4px 0 !important;
  white-space: normal !important;
  height: auto !important;
  line-height: 1.5 !important;

  .ant-menu-title-content {
    white-space: normal;
    line-height: 1.5;
    padding-right: 32px;
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

// 添加新的接口类型
interface ScaleOption {
  id: number;
  scaleId: number;
  optionName: string;
  optionValue: number;
  displayOrder: number;
  additionalInfo: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 定义维度类型
type Dimension = '看' | '听' | '说' | '记' | '想' | '做' | '运动';

// 定义类别
const categories = [
  { title: '喜欢', type: 'like', color: '#52c41a' },
  { title: '天赋', type: 'talent', color: '#1890ff' },
];

// 定义维度
const dimensions: Dimension[] = ['看', '听', '说', '记', '想', '做', '运动'];

interface Scale {
  id: number;
  content: string;
  elementId: number;
  type: 'like' | 'talent';
  direction: string;
  dimension: Dimension;
  options?: ScaleOption[]; // 添加options可选字段
}

const HomeButton = styled(Button)`
  margin-bottom: 20px;
  display: block;

  @media (max-width: 768px) {
    width: 100%;
    margin-bottom: 8px;
  }
`;

const ResponsiveSteps = styled(Steps)`
  @media (max-width: 768px) {
    flex-direction: row !important;
    display: flex !important;
    .ant-steps-item {
      flex: 1 1 0;
      min-width: 0;
      max-width: 100%;
      padding: 0 2px;
    }
    .ant-steps-item-tail {
      display: none !important;
    }
    .ant-steps-item-content {
      display: none;
    }
    .ant-steps-item-title {
      font-size: 12px;
      white-space: nowrap;
      text-align: center;
      padding: 0;
    }
    .ant-steps-item-icon {
      margin: 0 auto;
    }
  }
`;

const SiderContentWrapper = styled('div')`
  @media (max-width: 768px) {
    margin-top: 78px;
  }
`;

const TitleRow = styled.div`
  position: relative;
  width: 100%;
  height: 48px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    height: 40px;
    margin-bottom: 24px;
  }
`;

const AbsoluteTitle = styled(Title)`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0 !important;
  white-space: nowrap;
  font-size: 24px !important;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 18px !important;
  }
`;

const StyledHomeButton = styled(HomeButton)`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  height: 36px;
  font-size: 14px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  @media (max-width: 768px) {
    height: 32px;
    font-size: 13px;
    padding: 0 10px;
  }
`;

const Scale168Assessment: React.FC = () => {
  const navigate = useNavigate();
  const [currentCategory, setCurrentCategory] = useState<string>(categories[0].type);
  const [currentDimension, setCurrentDimension] = useState<Dimension>('看');
  const [currentPage, setCurrentPage] = useState(0);
  const [allQuestions, setAllQuestions] = useState<Scale[]>([]);
  const [questions, setQuestions] = useState<Scale[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
  const questionsPerPage = 3;
  const [savingStatus, setSavingStatus] = useState<Record<number, 'saving' | 'saved' | 'error'>>(
    {}
  );

  // 添加窗口大小变化监听
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 先加载问题
    fetchAllQuestions();
  }, []);

  // 添加新的useEffect，当问题加载完成后再加载答案
  useEffect(() => {
    if (allQuestions.length > 0) {
      // 问题加载完成后，加载用户答案
      fetch168Answers();
    }
  }, [allQuestions.length]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      filterQuestionsByCategoryAndDimension();
    }
  }, [currentCategory, currentDimension, allQuestions]);

  const fetchAllQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const response = await axios.get(getApiUrl('/scale168'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 直接使用返回数据中的scales和options
      const scales = response.data.data;

      // 不再需要遍历获取选项，因为options已经包含在每个scale中
      setAllQuestions(scales);
    } catch (error) {
      console.error('获取题目失败:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
      } else {
        message.error('获取题目失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterQuestionsByCategoryAndDimension = () => {
    const filteredQuestions = allQuestions.filter(
      (q) => q.type === currentCategory && q.dimension === currentDimension
    );
    setQuestions(filteredQuestions);
    setCurrentPage(0);
  };

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

  // 辅助函数：根据返回的值找到匹配的选项ID
  const findMatchingOptionId = (question: Scale, value: any): number | null => {
    if (!question.options || question.options.length === 0) {
      // 对于没有动态选项的题目，直接返回value
      console.log(`问题 ${question.id} 没有动态选项，直接使用value: ${value}`);
      return Number(value);
    }

    // 如果value本身就是option的ID，直接返回
    const optionById = question.options.find((opt) => opt.id === value);
    if (optionById) {
      console.log(`找到了匹配的选项ID ${value}`);
      return value;
    }

    // 如果value是optionValue，查找对应的ID
    const optionByValue = question.options.find((opt) => opt.optionValue === Number(value));
    if (optionByValue) {
      console.log(`通过optionValue ${value} 找到了选项ID ${optionByValue.id}`);
      return optionByValue.id;
    }

    console.log(`无法为问题 ${question.id} 和值 ${value} 找到匹配的选项，返回原值`);
    return Number(value); // 返回原始值而不是null，确保数据一致性
  };

  // 辅助函数：根据分数值找到最匹配的选项ID
  const findMatchingOptionIdByScore = (question: Scale, score: number): number | null => {
    if (!question.options || question.options.length === 0) {
      // 对于没有动态选项的题目，使用默认逻辑
      return score; // 直接返回分数作为ID
    }

    // 根据optionValue查找
    const optionByValue = question.options.find((opt) => opt.optionValue === score);
    if (optionByValue) {
      return optionByValue.id;
    }

    // 如果找不到精确匹配，寻找最接近的选项
    // 对选项按分数排序
    const sortedOptions = [...question.options].sort((a, b) => a.optionValue - b.optionValue);

    // 如果分数小于最小选项分数，返回第一个选项
    if (score <= sortedOptions[0].optionValue) {
      return sortedOptions[0].id;
    }

    // 如果分数大于最大选项分数，返回最后一个选项
    if (score >= sortedOptions[sortedOptions.length - 1].optionValue) {
      return sortedOptions[sortedOptions.length - 1].id;
    }

    // 在中间寻找最接近的选项
    for (let i = 0; i < sortedOptions.length - 1; i++) {
      const current = sortedOptions[i];
      const next = sortedOptions[i + 1];

      // 如果恰好等于某个选项的分数
      if (score === current.optionValue) {
        return current.id;
      }

      // 如果分数在两个选项之间，选择更接近的
      if (score > current.optionValue && score < next.optionValue) {
        const diffCurrent = Math.abs(score - current.optionValue);
        const diffNext = Math.abs(score - next.optionValue);

        if (diffCurrent <= diffNext) {
          return current.id;
        } else {
          return next.id;
        }
      }
    }

    // 如果无法匹配，返回原始分数
    return score;
  };

  // 获取用户的168方向量表答案
  const fetch168Answers = async (scaleId?: number) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const url = scaleId
        ? getApiUrl(`/scale168/answers/168?scaleId=${scaleId}`)
        : getApiUrl(`/scale168/answers/168`);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 使用API返回的答案数据
      const answers = response.data.data;
      console.log('获取的答案数据:', answers); // 调试日志

      // 创建scaleId -> optionId/value的映射
      const savedAnswersMap: Record<number, number> = {};

      // 遍历答案，尝试找到匹配的选项
      for (const answer of answers) {
        const { scaleId } = answer;
        let optionValue = null;

        // 尝试从不同字段获取选项值
        if (answer.optionId !== undefined) optionValue = answer.optionId;
        else if (answer.option_id !== undefined) optionValue = answer.option_id;
        else if (answer.score !== undefined) optionValue = answer.score;

        if (optionValue !== null) {
          // 找到对应的问题
          const matchedQuestion = allQuestions.find((q) => q.id === scaleId);
          if (matchedQuestion) {
            // 如果是分数值，使用新方法根据分数找最匹配的选项ID
            if (
              answer.score !== undefined &&
              matchedQuestion.options &&
              matchedQuestion.options.length > 0
            ) {
              const matchedOptionId = findMatchingOptionIdByScore(
                matchedQuestion,
                Number(answer.score)
              );
              if (matchedOptionId !== null) {
                savedAnswersMap[scaleId] = matchedOptionId;

                continue; // 已处理，跳过下面的逻辑
              }
            }

            // 常规方法：尝试找到匹配的选项ID
            const matchedOptionId = findMatchingOptionId(matchedQuestion, optionValue);
            if (matchedOptionId !== null) {
              savedAnswersMap[scaleId] = matchedOptionId;
            } else {
              // 如果找不到匹配的选项ID，直接使用原始值
              savedAnswersMap[scaleId] = optionValue;
            }
          } else {
            // 如果找不到匹配的问题，直接使用原始值
            savedAnswersMap[scaleId] = optionValue;
          }
        }
      }

      setAnswers((prev) => ({ ...prev, ...savedAnswersMap }));
      return answers;
    } catch (error) {
      console.error('获取168量表答案失败:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
      } else {
        message.error('获取168量表答案失败');
      }
      return [];
    }
  };

  const saveAnswer = async (questionId: number, optionId: number) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      // 设置保存中状态
      setSavingStatus((prev) => ({
        ...prev,
        [questionId]: 'saving',
      }));

      // 增加静默保存，不打扰用户
      await axios.post(
        getApiUrl(`/scale168/answers`),
        {
          scaleId: questionId,
          optionId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 设置保存成功状态
      setSavingStatus((prev) => ({
        ...prev,
        [questionId]: 'saved',
      }));

      // 可选：静默提示保存成功
      // message.success('答案已保存', 0.5);
    } catch (error) {
      console.error('保存答案失败:', error);

      // 设置保存失败状态
      setSavingStatus((prev) => ({
        ...prev,
        [questionId]: 'error',
      }));

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
      } else {
        // 如果保存失败，告知用户
        message.error('答案保存失败，请稍后重试');
      }
    }
  };

  // 修改处理答案的方法
  const handleAnswer = (questionId: number, value: number) => {
    console.log(`选择了问题${questionId}的选项:`, value);

    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // 选择选项时立即保存答案
    saveAnswer(questionId, value);
  };

  const handleNext = async () => {
    // 保存当前页的答案
    const startIdx = currentPage * questionsPerPage;
    const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
    const currentPageQuestions = questions.slice(startIdx, endIdx);

    // 检查当前页的答案是否都已回答
    const allAnswered = currentPageQuestions.every((q) => answers[q.id]);
    if (!allAnswered) {
      message.warning('请完成当前页的所有问题');
      return;
    }

    // 计算下一页
    const maxPage = Math.ceil(questions.length / questionsPerPage) - 1;
    if (currentPage < maxPage) {
      // 还有下一页问题
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 当前维度的问题已答完，找下一个维度
      const currentDimensionIndex = dimensions.indexOf(currentDimension);
      if (currentDimensionIndex < dimensions.length - 1) {
        // 还有下一个维度
        setCurrentDimension(dimensions[currentDimensionIndex + 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // 当前类别的所有维度都答完了，检查是否还有下一个类别
        if (currentCategory === categories[0].type) {
          setCurrentCategory(categories[1].type);
          setCurrentDimension('看'); // 重置为第一个维度
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // 所有问题都已完成
          handleComplete();
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      // 还有上一页问题
      setCurrentPage(currentPage - 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      // 当前维度的第一页，找上一个维度的最后一页
      const currentDimensionIndex = dimensions.indexOf(currentDimension);
      if (currentDimensionIndex > 0) {
        // 还有上一个维度
        const prevDimension = dimensions[currentDimensionIndex - 1];
        setCurrentDimension(prevDimension);
        // 设置为上一个维度的最后一页
        const prevDimensionQuestions = allQuestions.filter(
          (q) => q.type === currentCategory && q.dimension === prevDimension
        );
        const maxPage = Math.ceil(prevDimensionQuestions.length / questionsPerPage) - 1;
        setCurrentPage(Math.max(0, maxPage));
        // 添加延时确保状态更新后再滚动
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        // 当前类别的第一个维度，检查是否有上一个类别
        if (currentCategory === categories[1].type) {
          setCurrentCategory(categories[0].type);
          setCurrentDimension('运动'); // 设置为上一个类别的最后一个维度
          // 设置为该维度的最后一页
          const prevCategoryQuestions = allQuestions.filter(
            (q) => q.type === categories[0].type && q.dimension === '运动'
          );
          const maxPage = Math.ceil(prevCategoryQuestions.length / questionsPerPage) - 1;
          setCurrentPage(Math.max(0, maxPage));
          // 添加延时确保状态更新后再滚动
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
      }
    }
  };

  const handleComplete = async () => {
    navigate('/report');
  };

  const findFirstUnansweredCategory = () => {
    for (const category of categories) {
      for (const dimension of dimensions) {
        const dimensionQuestions = allQuestions.filter(
          (q) => q.type === category.type && q.dimension === dimension
        );
        const unansweredIndex = dimensionQuestions.findIndex((q) => !answers[q.id]);

        if (unansweredIndex !== -1) {
          return {
            category: category.type,
            dimension,
            page: Math.floor(unansweredIndex / questionsPerPage),
          };
        }
      }
    }
    return null;
  };

  const handleContinue = () => {
    const firstUnanswered = findFirstUnansweredCategory();
    if (firstUnanswered) {
      setCurrentCategory(firstUnanswered.category);
      setCurrentDimension(firstUnanswered.dimension);
      setCurrentPage(firstUnanswered.page);
    }
  };

  const getQuestionsForCategoryAndDimension = (category: string, dimension: Dimension) => {
    return allQuestions.filter((q) => q.type === category && q.dimension === dimension);
  };

  const getDimensionProgress = (category: string, dimension: Dimension) => {
    const dimensionQuestions = getQuestionsForCategoryAndDimension(category, dimension);
    const answeredCount = dimensionQuestions.filter((q) => answers[q.id]).length;
    return {
      total: dimensionQuestions.length,
      completed: answeredCount,
      percent: dimensionQuestions.length
        ? Math.round((answeredCount / dimensionQuestions.length) * 100)
        : 0,
    };
  };

  const getCategoryProgress = (category: string) => {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    for (const dimension of dimensions) {
      const dimensionQuestions = getQuestionsForCategoryAndDimension(category, dimension);
      totalQuestions += dimensionQuestions.length;
      answeredQuestions += dimensionQuestions.filter((q) => answers[q.id]).length;
    }

    return {
      total: totalQuestions,
      completed: answeredQuestions,
      percent: totalQuestions ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    };
  };

  const getCurrentCategoryColor = () => {
    const category = categories.find((c) => c.type === currentCategory);
    return category ? category.color : '#1890ff';
  };

  if (loading || allQuestions.length === 0) return null;

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = allQuestions.length;
  const progress = (totalAnswered / totalQuestions) * 100;
  const hasUnfinishedQuestions = progress < 100;

  // 获取当前页的问题
  const startIdx = currentPage * questionsPerPage;
  const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
  const currentPageQuestions = questions.slice(startIdx, endIdx);

  const isAllQuestionsAnswered = () => {
    return allQuestions.every((question) => answers[question.id]);
  };

  const isLastPage = () => {
    const isLastPageOfQuestions = currentPage >= Math.ceil(questions.length / questionsPerPage) - 1;
    const isLastDimension = currentDimension === dimensions[dimensions.length - 1];
    const isLastCategory = currentCategory === categories[categories.length - 1].type;
    return isLastPageOfQuestions && isLastDimension && isLastCategory;
  };

  return (
    <StyledLayout>
      <ToggleButton $collapsed={collapsed} onClick={() => setCollapsed(!collapsed)}>
        <MenuOutlined style={{ fontSize: 28 }} />
        <span
          style={{
            fontSize: 12,
            lineHeight: 1,
            textAlign: 'center',
            marginLeft: collapsed ? 8 : 0,
            marginTop: collapsed ? 0 : 4,
            color: '#333',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? '' : '收起'}
        </span>
      </ToggleButton>
      <StyledSider width={300} collapsed={collapsed} collapsible={false} trigger={null}>
        <SiderContentWrapper>
          <div style={{ padding: '0 24px', marginBottom: 16 }}>
            <Progress percent={Math.round(progress)} format={(percent) => `总进度 ${percent}%`} />
            {hasUnfinishedQuestions && (
              <Button type="primary" block onClick={handleContinue} style={{ marginTop: 16 }}>
                继续答题
              </Button>
            )}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[`${currentCategory}-${currentDimension}`]}
            defaultOpenKeys={collapsed ? [] : [categories[0].type, categories[1].type]}
            style={{ borderRight: 'none' }}
          >
            {categories.map((category) => {
              const categoryProgress = getCategoryProgress(category.type);

              return (
                <StyledSubMenu
                  key={category.type}
                  title={
                    <div>
                      <div>{category.title}</div>
                      <Progress
                        percent={categoryProgress.percent}
                        size="small"
                        format={() => `${categoryProgress.completed}/${categoryProgress.total}`}
                        strokeColor={category.color}
                      />
                    </div>
                  }
                >
                  {dimensions.map((dimension) => {
                    const dimensionProgress = getDimensionProgress(category.type, dimension);
                    const dimensionQuestions = getQuestionsForCategoryAndDimension(
                      category.type,
                      dimension
                    );
                    const allDimensionAnswered = dimensionQuestions.every((q) => answers[q.id]);

                    return (
                      <StyledMenuItem
                        key={`${category.type}-${dimension}`}
                        onClick={() => {
                          setCurrentCategory(category.type);
                          setCurrentDimension(dimension);
                          setCurrentPage(0);
                        }}
                        icon={
                          allDimensionAnswered ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : null
                        }
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong>{dimension}</Text>
                          <Progress
                            percent={dimensionProgress.percent}
                            size="small"
                            format={() =>
                              `${dimensionProgress.completed}/${dimensionProgress.total}`
                            }
                            strokeColor={category.color}
                          />
                        </Space>
                      </StyledMenuItem>
                    );
                  })}
                </StyledSubMenu>
              );
            })}
          </Menu>
        </SiderContentWrapper>
      </StyledSider>
      <StyledMainLayout collapsed={collapsed} onClick={() => setCollapsed(!collapsed)}>
        <StyledContent>
          <TitleRow>
            <AbsoluteTitle level={2}>喜欢与天赋自评</AbsoluteTitle>
            <StyledHomeButton
              icon={<HomeOutlined />}
              onClick={() => navigate('/home')}
            >
            </StyledHomeButton>
          </TitleRow>
          <ResponsiveSteps
            current={dimensions.indexOf(currentDimension)}
            items={dimensions.map((dimension) => ({
              title: dimension,
              style: { whiteSpace: 'normal', height: 'auto', padding: '8px 0' },
            }))}
            style={{ marginBottom: window.innerWidth <= 768 ? 0 : 40 }}
            progressDot
          />

          <StyledCard
            title={
              <Space>
                <Text style={{ color: getCurrentCategoryColor() }}>
                  {categories.find((c) => c.type === currentCategory)?.title} - {currentDimension}
                </Text>
                <Progress
                  percent={
                    ((currentPage + 1) / Math.ceil(questions.length / questionsPerPage)) * 100
                  }
                  format={() =>
                    `第 ${currentPage + 1}/${Math.ceil(questions.length / questionsPerPage)} 页`
                  }
                  size="small"
                  style={{ width: 120 }}
                  strokeColor={getCurrentCategoryColor()}
                />
              </Space>
            }
          >
            {currentPageQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                style={{ marginBottom: index < currentPageQuestions.length - 1 ? 16 : 0 }}
              >
                <Text style={{ fontSize: '16px' }}>
                  {startIdx + index + 1}. {question.content}
                  {savingStatus[question.id] && (
                    <span style={{ marginLeft: '10px' }}>
                      {savingStatus[question.id] === 'saving' && (
                        <Tooltip title="保存中...">
                          <LoadingOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                      )}
                      {savingStatus[question.id] === 'saved' && (
                        <Tooltip title="已保存">
                          <CheckOutlined style={{ color: '#52c41a' }} />
                        </Tooltip>
                      )}
                      {savingStatus[question.id] === 'error' && (
                        <Tooltip title="保存失败，请重试">
                          <CloseOutlined style={{ color: '#f5222d' }} />
                        </Tooltip>
                      )}
                    </span>
                  )}
                </Text>
                <Divider />

                <Radio.Group
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  value={answers[question.id]}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {question.options && question.options.length > 0 ? (
                      // 使用动态选项，按displayOrder排序
                      [...question.options]
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((option) => (
                          <Radio key={option.id} value={option.id}>
                            {option.optionName}
                            {option.additionalInfo && (
                              <div
                                style={{
                                  color: 'rgba(0, 0, 0, 0.45)',
                                  fontSize: '12px',
                                  marginTop: '4px',
                                }}
                              >
                                {option.additionalInfo}
                              </div>
                            )}
                          </Radio>
                        ))
                    ) : (
                      // 默认选项，只在没有动态选项时使用
                      <>
                        <Radio value={1}>非常符合</Radio>
                        <Radio value={2}>比较符合</Radio>
                        <Radio value={3}>一般</Radio>
                        <Radio value={4}>不太符合</Radio>
                        <Radio value={5}>完全不符合</Radio>
                      </>
                    )}
                  </Space>
                </Radio.Group>
              </QuestionCard>
            ))}

            <Divider />

            <Row justify="start" style={{ marginTop: '24px' }}>
              <Space>
                <Button
                  onClick={handlePrevious}
                  disabled={
                    currentPage === 0 &&
                    currentDimension === '看' &&
                    currentCategory === categories[0].type
                  }
                >
                  上一页
                </Button>
                <Button
                  type="primary"
                  onClick={isAllQuestionsAnswered() && isLastPage() ? handleComplete : handleNext}
                  disabled={!currentPageQuestions.every((q) => answers[q.id])}
                >
                  {isAllQuestionsAnswered() && isLastPage() ? '完成' : '下一页'}
                </Button>
              </Space>
            </Row>
          </StyledCard>
        </StyledContent>
      </StyledMainLayout>
    </StyledLayout>
  );
};

export default Scale168Assessment;
