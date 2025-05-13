import React from 'react';
import { Typography, Button, Layout } from 'antd';
import { FormOutlined, FileTextOutlined, MessageOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(139, 195, 74, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      url('/icons/paint-brush.svg'),
      url('/icons/music-note.svg'),
      url('/icons/math.svg'),
      url('/icons/sports.svg'),
      url('/icons/science.svg'),
      url('/icons/book.svg'),
      url('/icons/star.svg'),
      url('/icons/brain.svg'),
      url('/icons/lightbulb.svg'),
      url('/icons/heart.svg');
    background-repeat: no-repeat;
    background-position: 
      5% 20%,
      15% 80%,
      85% 15%,
      95% 75%,
      75% 85%,
      25% 10%,
      45% 30%,
      55% 70%,
      35% 60%,
      65% 40%;
    background-size: 
      60px 60px,
      50px 50px,
      55px 55px,
      45px 45px,
      50px 50px,
      40px 40px,
      48px 48px,
      52px 52px,
      46px 46px,
      44px 44px;
    opacity: 0.08;
    animation: float 20s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes float {
    0% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-10px) rotate(2deg); }
    50% { transform: translateY(0) rotate(0deg); }
    75% { transform: translateY(10px) rotate(-2deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
`;

const StyledContent = styled(Content)`
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  position: relative;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    height: 80vh;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
    border-radius: 50%;
    filter: blur(60px);
    z-index: -1;
  }
  
  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const PageTitle = styled(Title)`
  text-align: center;
  margin-bottom: 60px !important;
  color: #2e7d32 !important;
  font-size: 48px !important;
  font-weight: bold !important;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: linear-gradient(90deg, transparent, #4caf50, transparent);
    border-radius: 2px;
  }
  
  @media (max-width: 768px) {
    font-size: 36px !important;
    margin-bottom: 40px !important;
  }
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 600px;
  
  @media (max-width: 768px) {
    gap: 16px;
  }
`;

const MenuButton = styled(Button)`
  height: 80px !important;
  font-size: 20px !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
  border: none !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  padding: 0 32px !important;
  transition: all 0.3s !important;
  color: #1b5e20 !important;
  
  &:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
    background: white !important;
    color: #4caf50 !important;
  }
  
  .anticon {
    font-size: 24px !important;
    margin-right: 16px !important;
    color: #4caf50 !important;
  }
  
  @media (max-width: 768px) {
    height: 64px !important;
    font-size: 16px !important;
    padding: 0 24px !important;
    
    .anticon {
      font-size: 20px !important;
      margin-right: 12px !important;
    }
  }
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'scale168',
      icon: <FormOutlined />,
      label: '喜欢与天赋量表测评',
      onClick: () => navigate('/assessment/scale168')
    },
    {
      key: 'report',
      icon: <FileTextOutlined />,
      label: '查看报告',
      onClick: () => navigate('/report')
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: '问题咨询/AI对话',
      onClick: () => navigate('/chat')
    }
  ];

  return (
    <StyledLayout>
      <StyledContent>
        <PageTitle level={1}>天赋测评首页</PageTitle>
        <MenuContainer>
          {menuItems.map(item => (
            <MenuButton
              key={item.key}
              type="text"
              icon={item.icon}
              onClick={item.onClick}
            >
              {item.label}
            </MenuButton>
          ))}
        </MenuContainer>
      </StyledContent>
    </StyledLayout>
  );
};

export default HomePage;