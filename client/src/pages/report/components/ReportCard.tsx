import React from 'react';
import { Card } from 'antd';
import styled from '@emotion/styled';

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }

  .ant-card-head-title {
    font-size: 18px;
    font-weight: 600;
  }
`;

interface ReportCardProps {
  title: string;
  children: React.ReactNode;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, children }) => {
  return (
    <StyledCard title={title}>
      {children}
    </StyledCard>
  );
};

export default ReportCard;