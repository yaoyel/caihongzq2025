import React, { useState } from 'react';
import { Typography, Button, Card, Row, Col, Statistic, Carousel, Layout, Menu, Badge, Tag } from 'antd';
import { ArrowRightOutlined, ClockCircleOutlined, FormOutlined, QuestionCircleOutlined, HeartOutlined, UserOutlined, MessageOutlined, FileTextOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { Sider, Content } = Layout;

const StyledHero = styled.div`
  background: linear-gradient(135deg, #FFD700 0%, #32CD32 100%);
  padding: 60px 0;
  text-align: center;
  color: white;
`;

const PulseButton = styled(Button)`
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

const ConsultationTag = styled(Tag)`
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  &:hover {
    background: #f0f0f0;
  }
`;

const ReportTag = styled(ConsultationTag)`
  bottom: 110px;
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('scale');

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
      label: '喜欢与天赋量表测评',
      icon: <FormOutlined />,
      description: '112道专业量表题目',
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
      accuracy: '15岁+',
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

  return (
    <StyledLayout>
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
          <Title level={1}>发现孩子的天赋密码</Title>
          <Paragraph style={{ fontSize: '18px', color: 'white' }}>
            科学测评，让教育投资更有方向
          </Paragraph>
          <PulseButton 
            type="primary" 
            size="large" 
            icon={<ArrowRightOutlined />}
            onClick={handleStartAssessment}
          >
            立即开启测评
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