import React, { useState } from 'react';
import { Typography, Button, Card, Row, Col, Statistic, Carousel, Layout, Menu, Badge, Avatar, Dropdown } from 'antd';
import { ArrowRightOutlined, ClockCircleOutlined, FormOutlined, QuestionCircleOutlined, HeartOutlined, UserOutlined, MessageOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { Sider, Content } = Layout;

const StyledHero = styled.div`
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  padding: 100px 0;
  text-align: center;
  color: white;
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
      radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 20%),
      radial-gradient(circle at 90% 80%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 20%);
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
      url('/icons/book.svg');
    background-repeat: no-repeat;
    background-position: 
      5% 20%,
      15% 80%,
      85% 15%,
      95% 75%,
      75% 85%,
      25% 10%;
    background-size: 
      60px 60px,
      50px 50px,
      55px 55px,
      45px 45px,
      50px 50px,
      40px 40px;
    opacity: 0.15;
    animation: float 6s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }

  h1 {
    font-size: 56px !important;
    font-weight: bold !important;
    margin-bottom: 24px !important;
    text-shadow: 0 2px 4px rgba(0,0,0,0.15);
    position: relative;
    z-index: 1;
    background: linear-gradient(45deg, #FFFFFF 30%, #E0E0E0 70%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: titleShine 3s ease-in-out infinite;
  }

  @keyframes titleShine {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }

  .subtitle {
    font-size: 26px !important;
    margin-bottom: 50px !important;
    opacity: 0.95;
    position: relative;
    z-index: 1;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    font-weight: 300;
  }

  .hero-decoration {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    opacity: 0.1;
    background-image: 
      radial-gradient(circle at 20% 20%, #FFF 0%, transparent 1%),
      radial-gradient(circle at 80% 80%, #FFF 0%, transparent 1%);
    background-size: 50px 50px;
    animation: sparkle 4s ease-in-out infinite;
  }

  @keyframes sparkle {
    0% { opacity: 0.1; }
    50% { opacity: 0.15; }
    100% { opacity: 0.1; }
  }
`;

const PulseButton = styled(Button)`
  height: 56px !important;
  padding: 0 48px !important;
  font-size: 20px !important;
  border-radius: 28px !important;
  background: white !important;
  color: #4CAF50 !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important;
  position: relative;
  z-index: 1;
  
  &:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
    background: #F8F8F8 !important;
  }
  
  &:active {
    transform: translateY(0) !important;
  }
  
  .anticon {
    font-size: 22px !important;
    margin-left: 8px !important;
  }
  
  animation: pulse 2s infinite;
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const CaseCard = styled(Card)`
  margin: 16px;
  transition: all 0.3s;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  .ant-layout-sider {
    background: white;
    box-shadow: 2px 0 8px rgba(0,0,0,0.05);
  }
`;

const UserContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 40px;
  z-index: 1000;
`;

const StyledMenu = styled(Menu)`
  padding: 20px 0;
  .ant-menu-item {
    height: auto;
    line-height: 1.5;
    padding: 12px 24px;
    margin: 8px 0;
  }
`;

const StyledSider = styled(Sider)`
  position: relative;
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('scale');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const cases = [
    {
      title: '北京李妈妈',
      description: '通过测评节省2万无效钢琴课支出',
      saving: '20000',
      time: '2个月'
    },
    {
      title: '深圳张爸爸',
      description: '发现孩子机器人天赋，现获区级比赛金奖',
      saving: '15000',
      time: '3个月'
    }
  ];

  const methods = [
    {
      key: 'scale',
      label: '喜欢与天赋量表测评1',
      icon: <FormOutlined />,
      description: '112道专业量表题目',
      accuracy: '全部'
    },
    {
      key: 'scale168',
      label: '喜欢与天赋量表测评2',
      icon: <FormOutlined />,
      description: '168道专业量表题目',
      accuracy: '全部'
    },
    {
      key: 'qa',
      label: '喜欢与天赋问答',
      icon: <QuestionCircleOutlined />,
      description: '36道深度问答题目',
      accuracy: '4-8岁'
    },
    {
      key: 'seed',
      label: '热爱种子问答',
      icon: <HeartOutlined />,
      description: '36道热爱探索题目',
      accuracy: '9-15岁'
    },
    {
      key: 'self',
      label: '不一样的自己',
      icon: <UserOutlined />,
      description: '48道自我认知题目',
      accuracy: '14岁+',
      adultOnly: false
    },
    {
      key: 'report',
      label: '查看报告',
      icon: <FileTextOutlined />,
      description: '查看量表及问答报告'
    },
    {
      key: 'chat',
      label: '问题咨询',
      icon: <MessageOutlined />,
      description: '与AI对话'
    }
  ];

  const handleStartAssessment = () => {
    switch (selectedMethod) {
      case 'scale':
        navigate('/assessment/scale');
        break;
      case 'qa':
        navigate('/assessment/qa');
        break;
      default:
        navigate('/assessment/scale');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出系统',
      onClick: handleLogout
    }
  ];

  return (
    <StyledLayout>
      {user && (
        <UserContainer>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              background: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Avatar icon={<UserOutlined />} src={user.avatar} />
              <span style={{ marginLeft: '8px', marginRight: '12px' }}>{user.name || '用户'}</span>
              <LogoutOutlined style={{ color: '#999' }} />
            </div>
          </Dropdown>
        </UserContainer>
      )}
      
      <StyledSider width="auto" theme="light" style={{ minWidth: '200px', maxWidth: '300px' }}>
        <Title level={4} style={{ padding: '20px 24px 0' }}>
          测评方法
        </Title>
        <StyledMenu
          mode="inline"
          selectedKeys={[selectedMethod]}
          onClick={({ key }) => {
            setSelectedMethod(key as string);
            if (key === 'scale') {
              navigate('/assessment/scale');
            } else if (key === 'scale168') {
              navigate('/assessment/scale168');
            } else if (key === 'qa') {
              navigate('/assessment/qa');
            } else if (key === 'seed') {
              navigate('/assessment/qa-teen');
            } else if (key === 'self') {
              navigate('/assessment/qa-adult');
            } else if (key === 'report') {
              navigate('/report');
            } else if (key === 'chat') {
              navigate('/chat');
            }
          }}
        >
          {methods.map(method => (
            <Menu.Item key={method.key} icon={method.icon}>
              <div>
                <div>
                  {method.label}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>{method.description}</div>
                {method.adultOnly && <div style={{ marginTop: '4px' }}><Badge color="blue" text="成人专属" /></div>}
                {method.accuracy && <div style={{ fontSize: '12px', color: '#52c41a' }}>
                  使用人群：{method.accuracy}
                </div>}
              </div>
            </Menu.Item>
          ))}
        </StyledMenu>
      </StyledSider>
      
      <Content>
        <StyledHero>
          <div className="hero-decoration"></div>
          <Title level={1}>发现孩子的天赋密码</Title>
          <Paragraph className="subtitle">
            科学测评，让教育投资更有方向
          </Paragraph>
          <PulseButton 
            type="primary" 
            size="large" 
            onClick={handleStartAssessment}
          >
            立即开启测评
            <ArrowRightOutlined />
          </PulseButton>
        </StyledHero>

        <div style={{ padding: '40px' }}>
          <Row justify="center" align="middle" gutter={[16, 16]}>
            <Col span={24} md={8}>
              <Card>
                <Statistic
                  title="本区家长平均错过的天赋开发窗口"
                  value={3.7}
                  suffix="个"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Title level={2} style={{ textAlign: 'center', margin: '40px 0' }}>
            成功案例
          </Title>
          
          <Carousel autoplay>
            {cases.map((item, index) => (
              <div key={index}>
                <CaseCard>
                  <Card.Meta
                    title={item.title}
                    description={item.description}
                  />
                  <Row gutter={16} style={{ marginTop: '16px' }}>
                    <Col span={12}>
                      <Statistic
                        title="节省费用"
                        value={item.saving}
                        prefix="¥"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="见效时间"
                        value={item.time}
                      />
                    </Col>
                  </Row>
                </CaseCard>
              </div>
            ))}
          </Carousel>
        </div>
      </Content>
    </StyledLayout>
  );
};

export default HomePage;