import React from 'react';
import { Card, Typography } from 'antd';
import styled from '@emotion/styled';

const { Paragraph } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

interface DevelopmentSuggestionsProps {
  suggestions: string[];
}

const DevelopmentSuggestions: React.FC<DevelopmentSuggestionsProps> = ({
  suggestions = []
}) => {
  return (
    <StyledCard title="发展建议总结" className="page-break">
      <Paragraph>
        根据以上分析，我们建议：
        <ul>
          {suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      </Paragraph>
    </StyledCard>
  );
};

export default DevelopmentSuggestions;