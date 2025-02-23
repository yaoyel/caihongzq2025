import React, { useState } from 'react';
import { Steps, Card, Button, Progress, Image, Typography } from 'antd';
import { RocketOutlined, TrophyOutlined, HomeOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const StyledCard = styled(Card)`
  margin: 20px 0;
  .ant-card-body {
    padding: 24px;
  }
`;

const ProgressWrapper = styled.div`
  margin: 20px 0;
  text-align: center;
`;

const SceneImage = styled(Image)`
  width: 100%;
  max-width: 500px;
  margin: 20px auto;
  display: block;
  border-radius: 8px;
`;

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep] = useState(0);
  const [currentQuestion] = useState(0);

  const mockQuestions = [
    {
      id: 1,
      content: "当看到一堆乐高积木时，孩子最常做的是：",
      type: "scale",
      options: [
        { text: "按说明书一步步搭建", value: 1 },
        { text: "自由发挥创造新造型", value: 5 }
      ],
      imageUrl: "https://example.com/lego.jpg",
      sceneDescription: "观察孩子在自由玩耍时的表现"
    }
  ];

  const calculateProgress = () => {
    return (currentQuestion / mockQuestions.length) * 100;
  };

  return (
    <div style={{ padding: '20px' }}>
      <Button 
        icon={<HomeOutlined />} 
        onClick={() => navigate('/home')}
        style={{ marginBottom: '20px' }}
      >
        返回主页
      </Button>

      <Steps
        current={currentStep}
        items={[
          { title: '基础信息', icon: <RocketOutlined /> },
          { title: '能力测评', icon: <TrophyOutlined /> },
          { title: '兴趣探索', icon: <RocketOutlined /> },
          { title: '报告生成', icon: <TrophyOutlined /> }
        ]}
      />

      <StyledCard>
        <ProgressWrapper>
          <Progress
            type="circle"
            percent={calculateProgress()}
            format={percent => `完成 ${percent}%`}
          />
        </ProgressWrapper>

        {mockQuestions.map((question, index) => (
          currentQuestion === index && (
            <div key={question.id}>
              <Title level={4}>{question.content}</Title>
              
              {question.imageUrl && (
                <SceneImage
                  src={question.imageUrl}
                  alt="场景图片"
                />
              )}
            </div>
          )
        ))}
      </StyledCard>
    </div>
  );
};

export default AssessmentPage;
 