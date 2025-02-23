import React from 'react';
import { Layout, Typography, Button, Steps, Progress } from 'antd';
import styled from '@emotion/styled';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
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

const StyledSider = styled(Sider)`
  background: #fff;
  padding: 24px 0;
  height: calc(100vh - 120px);
  overflow-y: auto;
`;

interface AssessmentLayoutProps {
  title: string;
  progress: number;
  steps: {
    title: string;
    description?: string;
  }[];
  currentStep: number;
  siderContent: React.ReactNode;
  children: React.ReactNode;
  onContinue?: () => void;
}

const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({
  title,
  progress,
  steps,
  currentStep,
  siderContent,
  children,
  onContinue
}) => {
  const navigate = useNavigate();

  return (
    <StyledLayout>
      <StyledSider width={320}>
        <div style={{ padding: '0 24px', marginBottom: 16 }}>
          <Progress
            percent={Math.round(progress)}
            format={percent => `已完成 ${percent}%`}
          />
          {progress < 100 && onContinue && (
            <Button
              type="primary"
              block
              onClick={onContinue}
              style={{ marginTop: 16 }}
            >
              继续答题
            </Button>
          )}
        </div>
        {siderContent}
      </StyledSider>

      <Layout style={{ marginLeft: 320 }}>
        <StyledContent>
          <Button 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/home')}
            style={{ marginBottom: '20px' }}
          >
            返回主页
          </Button>

          <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
            {title}
          </Title>

          <Steps
            current={currentStep}
            items={steps}
            style={{ marginBottom: 40 }}
          />

          {children}
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default AssessmentLayout;