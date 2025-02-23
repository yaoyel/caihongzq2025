import React from 'react';
import { Card, Tag, Tooltip } from 'antd';
import styled from '@emotion/styled';
import { getDimensionColor } from '../../../config/colors';

interface TalentItem {
  id: number;
  name: string;
  category: string;
  description: string;
}

interface TalentAnalysisProps {
  talents: TalentItem[];
}

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  .ant-card-head {
    min-height: 48px;
    padding: 0 12px;
    .ant-card-head-title {
      padding: 12px 0;
    }
  }
`;

const StyledTag = styled(Tag)`
  margin: 4px;
  cursor: pointer;
`;

const getCategoryTitle = (category: string) => {
  const titles: { [key: string]: string } = {
    '看': '视觉空间',
    '听': '听觉音乐',
    '说': '语言表达',
    '记': '记忆学习',
    '想': '逻辑思维',
    '做': '动手操作',
    '运动': '身体运动'
  };
  return titles[category] || category;
};

const TalentAnalysis: React.FC<TalentAnalysisProps> = ({ talents }) => {
  const categories = ['看', '听', '说', '记', '想', '做', '运动'];

  return (
    <>
      {categories.map(category => {
        const categoryTalents = talents.filter(t => t.category === category);
        if (categoryTalents.length === 0) return null;

        return (
          <StyledCard
            key={category}
            title={getCategoryTitle(category)}
            headStyle={{ background: getDimensionColor(category, 'talent') }}
          >
            {categoryTalents.map(talent => (
              <Tooltip key={talent.id} title={talent.description}>
                <StyledTag>{talent.name}</StyledTag>
              </Tooltip>
            ))}
          </StyledCard>
        );
      })}
    </>
  );
};

export default TalentAnalysis; 