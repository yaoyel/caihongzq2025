import React from 'react';
import { Card, List, Typography, Tag, Space, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

const { Title } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  
  .ant-card-head {
    border-bottom: none;
    padding: 16px 24px 0;
  }
  
  .ant-card-body {
    padding: 16px 24px;
  }
`;

const StyledTag = styled(Tag)<{ $type: string }>`
  border-radius: 4px;
  padding: 4px 8px;
  margin: 0;
  font-size: 12px;
  ${props => {
    switch (props.$type) {
      case 'both':
        return 'background: #f6ffed; color: #52c41a; border-color: #b7eb8f;';
      case 'likeOnly':
        return 'background: #fff7e6; color: #fa8c16; border-color: #ffd591;';
      case 'talentOnly':
        return 'background: #e6f7ff; color: #1890ff; border-color: #91d5ff;';
      case 'neither':
        return 'background: #fff1f0; color: #f5222d; border-color: #ffa39e;';
      default:
        return 'background: #f5f5f5; color: #8c8c8c; border-color: #d9d9d9;';
    }
  }}
`;

interface TalentItem {
  id: number;
  name: string;
  category: 'both' | 'likeOnly' | 'talentOnly' | 'neither' | 'pending';
  status?: string;
}

interface TalentAnalysisProps {
  items: TalentItem[];
}

const getCategoryTitle = (category: string) => {
  switch (category) {
    case 'both':
      return '有喜欢有天赋';
    case 'likeOnly':
      return '有喜欢没天赋';
    case 'talentOnly':
      return '有天赋没喜欢';
    case 'neither':
      return '没喜欢没天赋';
    case 'pending':
      return '待确认';
    default:
      return '';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'both':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'likeOnly':
    case 'talentOnly':
      return <CheckCircleOutlined style={{ color: '#1890ff' }} />;
    case 'neither':
      return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
    default:
      return <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />;
  }
};

const TalentAnalysis: React.FC<TalentAnalysisProps> = ({ items }) => {
  const categories: string[] = ['both', 'likeOnly', 'talentOnly', 'neither', 'pending'];
  
  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>天赋分析结果</Title>
      {categories.map(category => {
        const categoryItems = items.filter(item => item.category === category);
        if (categoryItems.length === 0) return null;
        
        return (
          <StyledCard
            key={category}
            title={
              <Space>
                {getCategoryIcon(category)}
                {getCategoryTitle(category)}
                <span style={{ color: '#8c8c8c', fontSize: 14 }}>
                  ({categoryItems.length}项)
                </span>
              </Space>
            }
          >
            <List
              dataSource={categoryItems}
              renderItem={item => (
                <List.Item>
                  <Space>
                    <Tooltip title={item.status || getCategoryTitle(category)}>
                      <StyledTag $type={category}>{item.name}</StyledTag>
                    </Tooltip>
                  </Space>
                </List.Item>
              )}
              grid={{ gutter: 16, column: 4 }}
            />
          </StyledCard>
        );
      })}
    </div>
  );
};

export default TalentAnalysis;