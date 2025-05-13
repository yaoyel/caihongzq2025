// @ts-nocheck
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Layout, Typography, Card, Row, Col, Collapse, Tabs, List, Button, message, Space, Alert, Tag, Tooltip, Spin, Empty, Modal, Divider, Radio } from 'antd';
import styled from '@emotion/styled';
import { HomeOutlined, DownloadOutlined, QuestionCircleOutlined, BulbOutlined, ExclamationCircleOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { getApiUrl } from '../../config';
import { useDispatch, useSelector } from 'react-redux';
import { setElementAnalysis } from '../../store/slices/reportSlice';
import { RootState } from '../../store';
import ChatPage from '../chat';

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
    border-bottom: none;
    padding: 0;
  }

  .ant-card-head-title {
    padding: 0;
  }

  .ant-card-body {
    padding-top: 0;
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

// 添加类型定义和配置
interface TopicConfig {
  topic: string;
  options: Array<{ label: string; value: number }>;
}

const TYPE_CONFIGS: Record<string, TopicConfig> = {
  'inner_state': {
    topic: '您经常感受到下述哪种内在状态',
    options: [
      { label: '总是', value: 1 },
      { label: '经常', value: 2 },
      { label: '很少', value: 3 },
      { label: '从未', value: 4 },
      { label: '没注意', value: 5 }
    ]
  },
  'associate_with_people': {
    topic: '与人相处时，您经常感受到下述哪种内在状态？',
    options: [
      { label: '总是', value: 1 },
      { label: '经常', value: 2 },
      { label: '很少', value: 3 },
      { label: '从未', value: 4 },
      { label: '没注意', value: 5 }
    ]
  },
  'tackle_issues': {
    topic: '处理事情时，您经常感受到下述哪种内在状态？',
    options: [
      { label: '总是', value: 1 },
      { label: '经常', value: 2 },
      { label: '很少', value: 3 },
      { label: '从未', value: 4 },
      { label: '没注意', value: 5 }
    ]
  },
  'face_choices': {
    topic: '面对取舍时，您经常感受到下述哪种内在状态？',
    options: [
      { label: '总是', value: 1 },
      { label: '经常', value: 2 },
      { label: '很少', value: 3 },
      { label: '从未', value: 4 },
      { label: '没注意', value: 5 },
      { label: '"但"前符合，"但"后不符', value: 6 },
      { label: '从前经常，现在很少', value: 7 }
    ]
  },
  'common_outcome': {
    topic: '请感受一下，自己通常结果处于下述哪种状态？',
    options: [
      { label: '总是', value: 1 },
      { label: '经常', value: 2 },
      { label: '很少', value: 3 },
      { label: '从未', value: 4 },
      { label: '没注意', value: 5 },
      { label: '"但"前符合，"但"后不符', value: 6 },
      { label: '从前经常，现在很少', value: 7 }
    ]
  },
  'normal_state': {
    topic: '请感受一下，自己通常处于下述哪种状态？',
    options: [
      { label: '总是', value: 1 },
      { label: '经常', value: 2 },
      { label: '很少', value: 3 },
      { label: '从未', value: 4 },
      { label: '没注意', value: 5 },
      { label: '"但"前符合，"但"后不符', value: 6 },
      { label: '从前经常，现在很少', value: 7 }
    ]
  }
};

// 添加新的样式组件
const TopicText = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 12px;
  display: block;
`;

// 添加年龄段配置类型
interface AgeGroupAnalysis {
  key: string;
  title: string;
  prompt: string;  // 存储提示词但不显示
  items: Array<{
    key: string;
    title: string;
    prompt: string;  // 存储提示词但不显示
    content?: React.ReactNode;
  }>;
}

// 修改年龄段配置
const AGE_GROUP_ANALYSIS: AgeGroupAnalysis[] = [
  {
    key: 'kindergarten',
    title: '幼儿园及小学初年级',
    prompt: '完成喜欢与天赋量表，双刃剑深度确认，4-8岁的36问以后，结果最准确',
    items: [
      {
        key: 'anxiety',
        title: '焦虑点分析',
        prompt: '请基于孩子基础信息，深入分析孩子幼儿园阶段可能遭遇的问题及其成因（问题包含但不限于"安全感不足、到点不睡觉、分离焦虑、厌园、打人、便秘、不好好吃饭、不爱运动、哭闹、不自信等）"，并请结合附件所述赵巍同学特质，给出个性化/针对性问题解决方案，谢谢！'
      },
      {
        key: 'interest',
        title: '兴趣班选择指导',
        prompt: '请基于孩子基础信息，结合科研成果深入分析孩子在幼儿园阶段可能最适合选择什么兴趣班发展喜欢与天赋（包括但不限于舞蹈、篮球、钢琴、绘画……等），并请结合孩子基础信息，提供适合他的兴趣班学习方式、喜欢的老师类型，……请注意不要把前面对孩子基因、脑神经、激素等方面的推测直接作为结论引用，以确保分析更科学严谨可信……谢谢！'
      },
      {
        key: 'learning',
        title: '学习/课堂行为分析',
        prompt: '请基于孩子基础信息，科学严谨的深入分析赵巍同学小学阶段可能遭遇的问题及其成因（问题包含但不限于"做作业拖拉、学习各种偷懒、爱玩游戏、厌学、上课走神、不爱说话、兴趣班没兴趣、记不住古诗和英文单词等、数学题总不会、写作文没思路等），并请并请结合赵巍同学特质，给到适合的针对性解决方案，谢谢！'
      },
      {
        key: 'obstacle',
        title: '学习障碍分析',
        prompt: '请基于孩子基础信息，科学严谨的深入分析小学阶段语文、数学、英语可能遭遇的学习障碍及其成因（请以人教版最新小学内容为分析基础），并请给到孩子善用喜欢与天赋化解学习障碍的乐学善学针对性解决方案，谢谢！'
      }
    ]
  },
  {
    key: 'primary',
    title: '小学高年级及初中',
    prompt: '完成喜欢与天赋量表，双刃剑深度确认，9-14岁的36问以后最准确',
    items: [
      {
        key: 'interest',
        title: '兴趣/热爱方向分析',
        prompt: '请基于孩子基础信息，科学严谨的分析孩子在小学高年级/初中阶段可能的"热爱的种子"（包括但不限于社团组建、班委工作、学生会工作、编程、舞蹈、篮球、钢琴、绘画……等），并请提醒家长适合孩子的发展方式、可能遇到的困难、可能存在的"热爱的双刃剑"，更有助于孩子自驱自信的自我发展的陪伴方法。'
      },
      {
        key: 'obstacle',
        title: '学习障碍分析',
        prompt: '基于孩子基础信息，请细致分析孩子在初中阶段语文、数学、英语、物理、化学、生物、政治、地理、历史可能遭遇的学习障碍及其成因（请以人教版最新初中内容为分析基础），并请给到孩子善用喜欢与天赋化解学习障碍的针对性解决方案。'
      },
      {
        key: 'puberty',
        title: '青春期问题分析',
        prompt: '基于孩子基础信息，请深入分析孩子在青春期可能的叛逆行为表现、家长和老师要注意的最容易激发孩子反感的行为、以及更有助于孩子身心健康发展的陪伴要点'
      }
    ]
  },
  {
    key: 'highSchool',
    title: '高中',
    prompt: '完成喜欢与天赋量表，双刃剑深度确认，15+岁的36问和48问，结果最准确',
    items: [
      {
        key: 'subject',
        title: '文理选科分析',
        prompt: '作为一名脑神经科学专家、基因科学家、心理学家、HR专家、职涯规划专家、教育家，请基于我所提供的柏霖同学基础信息，以及我所提供的《喜欢与天赋》框架，对柏霖同学的特质给出您的专业评估，判断柏霖同学哪些维度喜欢明显/不明显，哪些维度天赋明显/不明显，并列出有科学研究依据的判断理由，可以深度思考+联网搜索辅助判断，但请只搜索专业类网站、科研成果类论文作为输入信息，不采用AI生产的内容，避免以讹传讹；同时，请基于柏霖同学特质分析他更适合文科还是理科、并请详细到文理科中的具体组合（如语数英+史地政、语数英+物化生等、请以国家最新文理分科具体分类为准），并分析原因、给到更有利于柏霖乐学善学的选科建议谢谢！'
      },
      {
        key: 'major',
        title: '适合专业评估',
        prompt: '作为一名脑神经科学专家、基因科学家、心理学家、HR专家、职涯规划专家、教育家，请基于我所提供的柏霖同学基础信息，以及我所提供的《喜欢与天赋》框架，对柏霖同学的特质给出您的专业评估，判断柏霖同学哪些维度喜欢明显/不明显，哪些维度天赋明显/不明显，并列出有科学研究依据的判断理由，可以深度思考+联网搜索辅助判断，但请只搜索专业类网站、科研成果类论文作为输入信息，不采用AI生产的内容，避免以讹传讹；同时，请分析柏霖同学更适合选择的大学和专业、并请详细到专业的具体分类（请以2024年高考全国高校在招专业为分析基础），并分析原因、给到柏霖同学更有利于在热爱中可持续发展的专业选择建议'
      },
      {
        key: 'obstacle',
        title: '学习障碍分析',
        prompt: '作为一名脑神经科学专家、基因科学家、心理学家、HR专家、职涯规划专家、教育家，请基于我所提供的柏霖同学基础信息，以及我所提供的《喜欢与天赋》框架，对柏霖同学的特质给出您的专业评估，判断柏霖同学哪些维度喜欢明显/不明显，哪些维度天赋明显/不明显，并列出有科学研究依据的判断理由，可以深度思考+联网搜索辅助判断，但请只搜索专业类网站、科研成果类论文作为输入信息，不采用AI生产的内容，避免以讹传讹；同时，请具体分析柏霖同学在高考冲刺阶段语数英史地政可能遭遇的具体学习障碍及其成因（请以2022、2023、2024年湖南省高考真题及所涉及的知识点为分析基础），并请给到柏霖同学善用喜欢与天赋化解学习障碍、快速提分的针对性解决方案'
      }
    ]
  },
  {
    key: 'university',
    title: '大学',
    prompt: '完成喜欢与天赋量表，双刃剑深度确认，15+岁的36问和48问最准确',
    items: [
      {
        key: 'career',
        title: '职业规划建议',
        prompt: '作为一名脑神经科学专家、基因科学家、心理学家、HR专家、职涯规划专家、教育家，请结合孩子基础信息、问答集内容，请分析孩子更适合就业还是考研、并请详细分析就业方向及建议原因（如行业选择、职业选择、请参考国家最新职业分类），或考研后的发展规划及建议原因（如继续攻读博士，或其他选择），给到更有利于孩子开心奋斗的发展建议'
      },
      {
        key: 'employment',
        title: '就业建议',
        prompt: '作为一名脑神经科学专家、基因科学家、心理学家、HR专家、职涯规划专家、教育家，请结合孩子基础信息、问答集内容，分析孩子更适合的企业（请参考各地企业对外公布的使命、愿景、价值观、长期战略、核心治理机制、关键里程碑、在招岗位胜任素质描述等信息），给出推荐原因，请挑选更有助于孩子与组织共赢发展的企业'
      },
      {
        key: 'postgraduate',
        title: '考研建议',
        prompt: '作为一名脑神经科学专家、基因科学家、心理学家、HR专家、职涯规划专家、教育家，请结合孩子基础信息、问答集内容，分析孩子更适合的专业及导师（请参考全球各高校及科研机构研究生招考专业及相关信息），给出推荐原因，请给到更有助于孩子与导师共赢探索的可选项'
      },
      {
        key: 'relationship',
        title: '另一半画像',
        prompt: '结合孩子行为与状态画像、问答集内容，请分析孩子心动女生画像，并提醒可能的矛盾、冲突、解决方法及建议原因，给到更有利于孩子幸福相爱的可落地建议'
      }
    ]
  }
];

// 修改 ThemeTitle 样式，使其颜色更浅
const ThemeTitle = styled.div`
  background-color: #fafafa;  // 更浅的背景色
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  border-left: 4px solid #40a9ff;  // 更浅的边框色
  
  .title-text {
    color: #1f1f1f;
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

// 添加新的样式组件
const SectionTitle = styled.div`
  position: relative;
  padding: 16px 24px;
  background: #f6f8fa;
  border-radius: 8px;
  margin-bottom: 24px;
  border-left: 4px solid #1890ff;

  .main-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f1f1f;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .subtitle {
    font-size: 14px;
    color: #666;
    margin-top: 8px;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 24px;
    width: 40px;
    height: 3px;
    background: #1890ff;
    border-radius: 2px;
  }
`;

// 添加 AnalysisCard 样式组件
const AnalysisCard = styled(Card)`
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  background: #fafafa;
  
  .ant-card-head {
    background: transparent;
    border-bottom: none;
    padding: 0;
  }
  
  .ant-card-head-title {
    padding: 0;
  }
  
  .analysis-content {
    padding: 16px;
    background: #fff;
    border-radius: 4px;
  }

  .ai-button {
    padding: 4px 12px;
    background: #e6f7ff;
    border-radius: 4px;
    color: #1890ff;
    
    &:hover {
      background: #bae7ff;
    }
    
    &:disabled {
      background: #f5f5f5;
      color: #d9d9d9;
    }
  }
`;

// 添加 ChatModal 样式组件
const ChatModal = styled(Modal)`
  .ant-modal-content {
    height: 90vh;
    display: flex;
    flex-direction: column;
    
    .ant-modal-body {
      flex: 1;
      padding: 0;
      overflow: hidden;
    }
  }

  .ant-modal-wrap {
    display: flex;
    justify-content: center;  // 水平居中
    align-items: center;      // 垂直居中
  }
  
  &.ant-modal {
    top: 0;
    padding-bottom: 0;
    max-width: 90vw;         // 设置最大宽度
    margin: 0 auto;          // 水平居中
  }
`;

const ResponsiveCard = styled(Card)`
  @media (max-width: 768px) {
    margin-bottom: 16px !important;
    .ant-card-head {
      font-size: 16px;
      padding: 8px 12px;
    }
    .ant-card-body {
      padding: 12px;
    }
  }
`;

const ResponsiveSpace = styled(Space)`
  @media (max-width: 768px) {
    flex-direction: column !important;
    width: 100%;
    > * {
      width: 100%;
    }
  }
`;

const ResponsiveTabs = styled(Tabs)`
  @media (max-width: 768px) {
    .ant-tabs-nav-list {
      flex-wrap: wrap;
    }
    .ant-tabs-tab {
      font-size: 14px;
      padding: 4px 8px;
    }
  }
`;

const ResponsiveList = styled(List)`
  @media (max-width: 768px) {
    .ant-list-item {
      padding: 8px 0;
    }
  }
`;

const ResponsiveRow = styled(Row)`
  @media (max-width: 768px) {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
`;

const ResponsiveCol = styled(Col)`
  @media (max-width: 768px) {
    flex: 0 0 100%;
    max-width: 100%;
  }
`;

const HomeButton = styled(Button)`
  @media (max-width: 768px) {
    display: none !important;
  }
`;

const ExportButton = styled(Button)`
  @media (max-width: 768px) {
    display: block;
    width: 100%;
    margin-top: 8px;
  }
`;

const ResponsiveReportTitle = styled(ReportTitle)`
  @media (max-width: 768px) {
    font-size: 18px !important;
    margin-bottom: 16px !important;
    width: 100%;
    min-width: 0;
    word-break: break-all;
    white-space: normal;
  }
`;

const Report168Page: React.FC = () => {
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
          onClick={handleSubmit}
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
      
      {scaleData.map((scale) => {
        const config = TYPE_CONFIGS[scale.type];
        return (
          <QuestionCard key={scale.id}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <TopicText>{config.topic}</TopicText>
              <Text>{scale.content}</Text>
              <Divider />
              <Radio.Group
                onChange={(e) => handleAnswer(scale.id, e.target.value)}
                value={scaleAnswers[scale.id]}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {config.options.map(option => (
                    <Radio key={option.value} value={option.value}>
                      {option.label}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Space>
          </QuestionCard>
        );
      })}
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

  // 修改提交处理逻辑
  const handleSubmit = async () => {
    const success = await saveScaleAnswers();
    if (success) {
      message.success('提交成功');
      setModalVisible(false);
      // 立即更新统计数据
      await fetchAnswerStats();
      // 清空答案
      setScaleAnswers({});
    }
  };

  // 添加新的状态来控制展开/收起
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // 添加新的状态来存储当前prompt
  const [currentPrompt, setCurrentPrompt] = useState('');

  // 添加新的状态来跟踪SSE传输状态
  const [isStreaming, setIsStreaming] = useState(false);

  // 添加类型定义
  interface Message {
    id: number;
    content: string;
    role: 'user' | 'assistant';
    createdAt: string;
  }

  // 添加所有状态
  const [analysisMessages, setAnalysisMessages] = useState<Record<string, Message[]>>({});

  // 修改消息展示组件
  const MessageDisplay: React.FC<{ messages: Message[] }> = ({ messages }) => (
    <div style={{ 
      padding: '16px',
      maxHeight: '400px', // 设置最大高度
      overflowY: 'auto', // 添加垂直滚动条
      scrollBehavior: 'smooth' // 平滑滚动
    }}>
      {messages.map((message, index) => (
        <div 
          key={index}
          style={{ 
            marginBottom: '16px',
            textAlign: message.role === 'user' ? 'right' : 'left'
          }}
        >
          <div
            style={{
              display: 'inline-block',
              maxWidth: '80%',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: message.role === 'user' ? '#e6f7ff' : '#f5f5f5',
              wordBreak: 'break-word', // 添加长文本换行
              whiteSpace: 'pre-wrap', // 保留换行和空格
            }}
          >
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );

  // 添加获取聊天记录的函数
  const fetchAnalysisMessages = async (groupTitle: string, itemTitle: string) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr!);
      if (!token || !userStr) return;

      const sessionName = `${groupTitle}-${itemTitle}`;
      const existingSession = await axios.get(
        getApiUrl(`/chat/sessions/findByTitle?title=${encodeURIComponent(sessionName)}&userId=${user.id}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (existingSession.data) {
        const messages = await axios.get(
          getApiUrl(`/chat/sessions/${existingSession.data.id}/messages`),
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setAnalysisMessages(prev => ({
          ...prev,
          [sessionName]: messages.data
        }));
      }
    } catch (error) {
      console.error('获取分析消息失败:', error);
    }
  };

  // 修改创建session的函数
  const createAnalysisSession = async (groupTitle: string, itemTitle: string, prompt: string) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr!);
      if (!token || !userStr) {
        message.error('请先登录');
        return;
      }

      const sessionName = `${groupTitle}-${itemTitle}`;
      
      // 先查询是否存在相同名称的session
      const existingSession = await axios.get(
        getApiUrl(`/chat/sessions/findByTitle?title=${encodeURIComponent(sessionName)}&userId=${user.id}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      let sessionId;
      let shouldSetPrompt = true;

      if (existingSession.data) {
        sessionId = existingSession.data.id;
        
        // 获取消息记录
        const messages = await axios.get(
          getApiUrl(`/chat/sessions/${existingSession.data.id}/messages`),
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // 只有当没有消息记录时才设置初始prompt
        shouldSetPrompt = messages.data.length === 0;
      } else {
        // 如果不存在则创建新的session
        const response = await axios.post(
          getApiUrl('/chat/sessions'), 
          {
            title: sessionName,
            userId: user.id,
            systemPrompt: prompt
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        sessionId = response.data?.id;
      }

      if (sessionId) {
        setCurrentSessionId(sessionId);
        setCurrentPrompt(shouldSetPrompt ? prompt : '');
        setChatModalVisible(true);
      }
    } catch (error) {
      console.error('创建分析会话失败:', error);
      message.error('创建分析会话失败');
    }
  };

  // 添加关闭确认函数
  const handleCloseModal = () => {
    Modal.confirm({
      title: '确认关闭',
      content: '确定要关闭当前分析吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setChatModalVisible(false);
        setCurrentPrompt('');
      }
    });
  };

  // 修改年龄段个性化分析的渲染部分
  return (
    <StyledLayout>
      <PrintableContent ref={componentRef}>
        <ResponsiveRow>
          <ResponsiveCol span={24}>
            <ResponsiveSpace style={{ marginBottom: 16 }}>
              <HomeButton icon={<HomeOutlined />} onClick={() => navigate('/home')}>
                返回主页
              </HomeButton>
              <ExportButton icon={<DownloadOutlined />} onClick={handleExportPDF}>
                导出PDF
              </ExportButton>
            </ResponsiveSpace>

            <ResponsiveReportTitle level={2}>学生综合能力评估报告</ResponsiveReportTitle>

            <ResponsiveCard 
              title={
                <SectionTitle>
                  <div className="main-title">喜欢与天赋分布</div>
                </SectionTitle>
              }
            >
              <ResponsiveRow gutter={24}>
                <ResponsiveCol span={24}>
                  <ResponsiveTabs
                    defaultActiveKey="result"
                    items={[
                      {
                        key: 'result',
                        label: '按结果分组',
                        children: (
                          <Collapse defaultActiveKey={[]}>
                            <Panel 
                              header={
                                <ResponsiveSpace>
                                  <Text strong>有喜欢有天赋</Text>
                                  <Tooltip title={CATEGORY_TIPS['有喜欢有天赋']} overlayStyle={{ maxWidth: '500px' }}>
                                    <QuestionCircleOutlined />
                                  </Tooltip>
                                </ResponsiveSpace>
                              } 
                              key="1"
                            >
                              <ResponsiveList
                                grid={{ gutter: 8, column: window.innerWidth <= 768 ? 1 : 4 }}
                                dataSource={elementAnalysis
                                  .filter(item => item.category === '有喜欢有天赋')
                                  .sort(sortByDimension)
                                }
                                renderItem={item => (
                                  <List.Item>
                                    <ResponsiveCard title={item.dimension} size="small">
                                      <ResponsiveSpace direction="vertical" style={{ width: '100%' }}>
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
                                      </ResponsiveSpace>
                                    </ResponsiveCard>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel 
                              header={
                                <ResponsiveSpace>
                                  <Text strong>有喜欢没天赋</Text>
                                  <Tooltip title={CATEGORY_TIPS['有喜欢没天赋']} overlayStyle={{ maxWidth: '500px' }}>
                                    <QuestionCircleOutlined />
                                  </Tooltip>
                                </ResponsiveSpace>
                              } 
                              key="2"
                            >
                              <ResponsiveList
                                grid={{ gutter: 8, column: window.innerWidth <= 768 ? 1 : 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '有喜欢没天赋').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <ResponsiveCard title={item.dimension} size="small">
                                      <ResponsiveSpace direction="vertical" style={{ width: '100%' }}>
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
                                      </ResponsiveSpace>
                                    </ResponsiveCard>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel 
                              header={
                                <ResponsiveSpace>
                                  <Text strong>有天赋没喜欢</Text>
                                  <Tooltip title={CATEGORY_TIPS['有天赋没喜欢']} overlayStyle={{ maxWidth: '500px' }}>
                                    <QuestionCircleOutlined />
                                  </Tooltip>
                                </ResponsiveSpace>
                              } 
                              key="3"
                            >
                              <ResponsiveList
                                grid={{ gutter: 8, column: window.innerWidth <= 768 ? 1 : 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '有天赋没喜欢').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <ResponsiveCard title={item.dimension} size="small">
                                      <ResponsiveSpace direction="vertical" style={{ width: '100%' }}>
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
                                      </ResponsiveSpace>
                                    </ResponsiveCard>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel 
                              header={
                                <ResponsiveSpace>
                                  <Text strong>没喜欢没天赋</Text>
                                  <Tooltip title={CATEGORY_TIPS['没喜欢没天赋']} overlayStyle={{ maxWidth: '500px' }}>
                                    <QuestionCircleOutlined />
                                  </Tooltip>
                                </ResponsiveSpace>
                              } 
                              key="4"
                            >
                              <ResponsiveList
                                grid={{ gutter: 8, column: window.innerWidth <= 768 ? 1 : 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '没喜欢没天赋').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <ResponsiveCard title={item.dimension} size="small">
                                      <ResponsiveSpace direction="vertical" style={{ width: '100%' }}>
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
                                      </ResponsiveSpace>
                                    </ResponsiveCard>
                                  </List.Item>
                                )}
                              />
                            </Panel>
                            <Panel header="待确认" key="5">
                              <ResponsiveList
                                grid={{ gutter: 8, column: window.innerWidth <= 768 ? 1 : 4 }}
                                dataSource={elementAnalysis.filter(item => item.category === '待确认').sort(sortByDimension)}
                                renderItem={item => (
                                  <List.Item>
                                    <ResponsiveCard title={item.dimension} size="small">
                                      <ResponsiveSpace>
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
                                      </ResponsiveSpace>
                                    </ResponsiveCard>
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
                                <ResponsiveList
                                  grid={{ gutter: 8, column: window.innerWidth <= 768 ? 1 : 4 }}
                                  dataSource={elementAnalysis.filter(item => item.dimension === dimension)}
                                  renderItem={item => (
                                    <List.Item>
                                      <ResponsiveCard title={item.category} size="small">
                                        <ResponsiveSpace direction="vertical" style={{ width: '100%' }}>
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
                                        </ResponsiveSpace>
                                      </ResponsiveCard>
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
                          <ResponsiveTabs
                            items={[
                              {
                                key: 'like',
                                label: '喜欢',
                                children: (
                                  <ResponsiveList
                                    grid={{ gutter: 8, column: window.innerWidth <= 768 ? 1 : 4 }}
                                    dataSource={[...elementAnalysis].sort(sortByDimension)}
                                    renderItem={item => (
                                      <List.Item>
                                        <ResponsiveCard title={item.dimension} size="small">
                                          <ResponsiveSpace direction="vertical" style={{ width: '100%' }}>
                                            <div>
                                              <Text type="secondary">喜欢：</Text>
                                              <Tooltip title={item.like_status}>
                                                <Tag color={item.category.includes('有喜欢') ? 'green' : 'default'}>
                                                  {item.like_element}
                                                  {item.category.includes('有喜欢') ? ' ✓' : ' ✗'}
                                                </Tag>
                                              </Tooltip>
                                            </div>
                                          </ResponsiveSpace>
                                        </ResponsiveCard>
                                      </List.Item>
                                    )}
                                  />
                                )
                              },
                              {
                                key: 'talent',
                                label: '天赋',
                                children: (
                                  <ResponsiveList
                                    grid={{ gutter: 8, column: window.innerWidth <= 768 ? 1 : 4 }}
                                    dataSource={[...elementAnalysis].sort(sortByDimension)}
                                    renderItem={item => (
                                      <List.Item>
                                        <ResponsiveCard title={item.dimension} size="small">
                                          <ResponsiveSpace direction="vertical" style={{ width: '100%' }}>
                                            <div>
                                              <Text type="secondary">天赋：</Text>
                                              <Tooltip title={item.talent_status}>
                                                <Tag color={item.category.includes('有天赋') ? 'blue' : 'default'}>
                                                  {item.talent_element}
                                                  {item.category.includes('有天赋') ? ' ✓' : ' ✗'}
                                                </Tag>
                                              </Tooltip>
                                            </div>
                                          </ResponsiveSpace>
                                        </ResponsiveCard>
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
                </ResponsiveCol>
              </ResponsiveRow>
            </ResponsiveCard>

            <ResponsiveCard 
              title={
                <SectionTitle>
                  <div className="main-title">
                    性格特征双刃剑分析
                    <Tooltip title="这些特征是基于您的喜好和天赋组合分析得出的，了解这些特征有助于扬长避短，更好地发展。">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </div>
                </SectionTitle>
              }
            >
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
            </ResponsiveCard>

            <ResponsiveCard 
              title={
                <SectionTitle>
                  <div className="main-title">课堂表现分析</div>
                </SectionTitle>
              }
            >
              <ResponsiveRow gutter={24}>
                {Object.entries(CLASSROOM_PERFORMANCE_ELEMENTS).map(([dimension, config]) => {
                  const dimensionElements = elementAnalysis.filter(item => 
                    item.dimension === dimension && 
                    config.elementIds.includes(item.element_id)
                  );

                  return (
                    <ResponsiveCol span={8} key={dimension}>
                      <ResponsiveCard 
                        title={config.title} 
                        bordered={false}
                      >
                        <ResponsiveSpace direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary">喜欢：</Text>
                            <ResponsiveSpace wrap>
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
                            </ResponsiveSpace>
                          </div>
                          <div>
                            <Text type="secondary">天赋：</Text>
                            <ResponsiveSpace wrap>
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
                            </ResponsiveSpace>
                          </div>
                        </ResponsiveSpace>
                      </ResponsiveCard>
                    </ResponsiveCol>
                  );
                })}
              </ResponsiveRow>
            </ResponsiveCard>

            <ResponsiveCard 
              title={
                <SectionTitle>
                  <div className="main-title">年龄段个性化分析</div>
                  <div className="subtitle">根据年龄特点提供个性化分析和建议</div>
                </SectionTitle>
              }
            >
              <ResponsiveTabs
                type="card"
                items={AGE_GROUP_ANALYSIS.map(group => ({
                  key: group.key,
                  label: group.title,
                  children: (
                    <div>
                      <Alert
                        type="info"
                        message={group.prompt}
                        style={{ marginBottom: 16 }}
                      />
                      {group.items.map(item => {
                        const sessionName = `${group.key}-${item.key}`;
                        const messages = analysisMessages[sessionName] || [];

                        useEffect(() => {
                          fetchAnalysisMessages(group.title, item.title);
                        }, [group.title, item.title]);
                        
                        return (
                          <AnalysisCard
                            key={item.key}
                            title={
                              <ThemeTitle>
                                <div className="title-text">
                                  {item.title}
                                  <Button
                                    type="link"
                                    className="ai-button"
                                    disabled={isStreaming}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      createAnalysisSession(group.title, item.title, item.prompt);
                                    }}
                                  >
                                    AI分析
                                    {isStreaming && <Spin size="small" style={{ marginLeft: '8px' }} />}
                                  </Button>
                                </div>
                              </ThemeTitle>
                            }
                          >
                            <div className="analysis-content">
                              {messages.length > 0 ? (
                                <MessageDisplay messages={messages} />
                              ) : (
                                <Empty description="暂无分析结果" />
                              )}
                            </div>
                          </AnalysisCard>
                        );
                      })}
                    </div>
                  )
                }))}
              />
            </ResponsiveCard>

            <ResponsiveCard title="发展建议总结" className="page-break">
              <Paragraph>
                根据以上分析，我们建议：
                <ul>
                  <li>充分发挥人际交往能力，参与更多团队活动</li>
                  <li>注意力训练，提高学习效率</li>
                  <li>平衡个人发展，建立健康的学习心态</li>
                </ul>
              </Paragraph>
            </ResponsiveCard>

            <ResponsiveCard className="no-print">
              <Text type="secondary">
                注：本报告基于学生问答和行为数据分析生成，仅供参考。建议结合专业教师意见和实际情况使用。
              </Text>
            </ResponsiveCard>
          </ResponsiveCol>
        </ResponsiveRow>
      </PrintableContent>

      <div style={{ marginTop: '40px' }} className="no-print">
        <ResponsiveRow justify="center">
          <ResponsiveSpace size="large">
            <Button type="primary" size="large">
              咨询专家解读
            </Button>
            <Button size="large">
              分享报告
            </Button>
          </ResponsiveSpace>
        </ResponsiveRow>
      </div>

      {renderModal()}

      {/* 修改Chat Modal */}
      <ChatModal
        title="AI分析"
        open={chatModalVisible}
        onCancel={handleCloseModal}
        maskClosable={false}
        keyboard={false}
        width="80%"
        footer={null}
        destroyOnClose
        closeIcon={
          <Button 
            type="text" 
            icon={<CloseOutlined />}
          />
        }
      >
        <ChatPage 
          sessionId={currentSessionId} 
          isModal={true}
          initialPrompt={currentPrompt}
          onStreamingChange={setIsStreaming}
        />
      </ChatModal>
    </StyledLayout>
  );
}

export default Report168Page;
