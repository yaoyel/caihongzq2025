import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Row, Col, Space, Card, Carousel, Statistic, message, Spin, Menu, Dropdown } from 'antd';
import { WechatOutlined, SafetyCertificateOutlined, PlayCircleOutlined, BookOutlined, UserOutlined, SettingOutlined, LogoutOutlined, CaretDownOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';
import Avatar from '../../components/Avatar';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(45deg, #89C4F4 0%, #C7F4D3 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('/tree-rings.png');
    background-size: cover;
    opacity: 0.05;
    pointer-events: none;
  }
`;

const NavBar = styled.div`
  padding: 20px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  color: #333;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled(Avatar)`
  cursor: pointer;
  background: #1890ff;
`;
const MainContent = styled(Content)`
  padding: 40px;
  position: relative;
  z-index: 1;
`;

const WechatButton = styled(Button)`
  height: 60px;
  width: 240px;
  font-size: 18px;
  background: #FFB347;
  border-color: #FFB347;
  box-shadow: 0 4px 12px rgba(255, 179, 71, 0.3);
  
  &:hover {
    background: #FFA533;
    border-color: #FFA533;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  animation: pulse 2s infinite;
`;

const CaseCard = styled(Card)`
  margin: 16px 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  .ant-card-body {
    padding: 16px;
  }
`;

const BottomBar = styled.div`
  padding: 24px 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuickLink = styled(Button)`
  color: #333;
  &:hover {
    color: #1890ff;
  }
`;

const RealTimeNotice = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
`;

const cases = [
  {
    title: '6岁发现音乐天赋',
    result: '钢琴比赛金奖',
    description: '通过天赋测评发现音乐潜能，3个月后参赛获奖'
  },
  {
    title: '8岁确认逻辑天赋',
    result: '奥数竞赛一等奖',
    description: '定制学习方案，激发数理思维能力'
  },
  {
    title: '5岁识别运动天赋',
    result: '少儿体操冠军',
    description: '科学选择运动项目，充分发挥身体优势'
  }
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showNotice, setShowNotice] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserInfo(user);
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <UserOutlined /> 个人资料
      </Menu.Item>
      <Menu.Item key="settings">
        <SettingOutlined /> 设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> 退出登录
      </Menu.Item>
    </Menu>
  );
  // 获取登录二维码
  const getLoginQrCode = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('http://a8tak5.natappfree.cc/api/wechat/qrcode');
      console.log('接口返回数据:', response);

      // 检查响应状态
      if (response.status !== 200) {
        throw new Error('服务器响应异常');
      }

      // 检查是否有错误信息
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // 检查数据完整性
      const { ticket, sceneStr, qrUrl, isTest } = response.data;
      if ((!ticket || !sceneStr) && !isTest) {
        throw new Error('响应数据不完整');
      }

      // 检查二维码URL是否有效
      if (!qrUrl) {
        throw new Error('无效的二维码URL');
      }

      // 更新状态
      setQrUrl(qrUrl);
      
      if (!isTest) {
        startPolling(sceneStr);
      } else {
        message.info('当前使用测试二维码，请在微信公众平台完成认证后使用正式二维码');
      }
    } catch (error: any) {
      console.error('获取二维码失败:', error);
      setError(error.message || '获取二维码失败，请重试');
      message.error(error.message || '获取二维码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 开始轮询检查登录状态
  const startPolling = (scene: string) => {
    setPolling(true);
    const timer = setInterval(async () => {
      try {
        const response = await axios.get(`http://a8tak5.natappfree.cc/api/wechat/check-login?scene=${scene}`);
        const { success, user,token } = response.data;
        
        if (success) {
          clearInterval(timer);
          setPolling(false);
          // 存储用户信息和token
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', token);
          
          // 设置全局请求头
          axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
          console.log(user,token)
          message.success('登录成功');

          navigate('/home');
        }
      } catch (error) {
        clearInterval(timer);
        setPolling(false);
        message.error('登录检查失败，请重试');
      }
    }, 2000); // 每2秒检查一次

    // 清理定时器
    return () => {
      clearInterval(timer);
      setPolling(false);
    };
  };

  // 检查本地存储并尝试自动登录
  useEffect(() => {
    const checkLocalAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          // 设置全局请求头
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // 获取用户信息
          const response = await axios.get(getApiUrl('/users/me'));
          
          if (response.status === 200) {
            // 更新用户信息
            localStorage.setItem('user', JSON.stringify(response.data));
            message.success('自动登录成功');
            navigate('/home');
            return;
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            // 清除无效的认证信息
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          console.error('自动登录失败:', error);
        }
      }
      
      // 如果没有本地认证信息或认证失败，则获取登录二维码
      getLoginQrCode();
    };

    checkLocalAuth();
  }, [navigate]);

  const handleWechatLogin = () => {
    if (!polling) {
      getLoginQrCode();
    }
  };

  return (
    <StyledLayout>
      <NavBar>
        <Logo>
          🔭 天赋探索
          <Text type="secondary" style={{ fontSize: '14px', marginLeft: '20px' }}>
            中国科学院心理研究所战略合作
          </Text>
        </Logo>
        {userInfo && (
          <UserInfo>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space>
                <UserAvatar size="large">
                  {userInfo.nickname?.[0] || userInfo.username?.[0] || 'U'}
                </UserAvatar>
                <Text strong>{userInfo.nickname || userInfo.username}</Text>
                <CaretDownOutlined />
              </Space>
            </Dropdown>
          </UserInfo>
        )}
      </NavBar>

      <MainContent>
        <Row gutter={48} align="middle">
          <Col span={12}>
            <Title>
              每个孩子都是「隐藏版」天才
            </Title>
            <Paragraph style={{ fontSize: '18px', marginBottom: '40px' }}>
              通过21天观察法，发现孩子的5大天赋领域
            </Paragraph>

            <Carousel autoplay>
              {cases.map((item, index) => (
                <div key={index}>
                  <CaseCard>
                    <Title level={4}>{item.title} → {item.result}</Title>
                    <Paragraph>{item.description}</Paragraph>
                  </CaseCard>
                </div>
              ))}
            </Carousel>

            <Statistic 
              title="已完成家长的焦虑缓解" 
              value={83} 
              suffix="%" 
              style={{ marginTop: '40px' }}
            />
          </Col>

          <Col span={12} style={{ textAlign: 'center' }}>
            <Space direction="vertical" size="large" align="center">
              {error ? (
                <div style={{ textAlign: 'center' }}>
                  <Text type="danger">{error}</Text>
                  <br />
                  <Button 
                    type="primary" 
                    onClick={() => getLoginQrCode()}
                    style={{ marginTop: '16px' }}
                  >
                    重试
                  </Button>
                </div>
              ) : qrUrl ? (
                <>
                  <div style={{ 
                    width: 280, 
                    height: 280, 
                    border: '1px solid #eee',
                    borderRadius: 8,
                    padding: 20,
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {loading ? (
                      <div style={{ textAlign: 'center' }}>
                        <Spin size="large" />
                        <br />
                        <Text type="secondary" style={{ marginTop: '16px' }}>
                          加载中...
                        </Text>
                      </div>
                    ) : (
                      <img 
                        src={qrUrl} 
                        alt="微信扫码登录" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain' 
                        }} 
                        onError={() => {
                          setError('二维码加载失败');
                          setQrUrl('');
                        }}
                      />
                    )}
                  </div>
                  <Text type="secondary">请使用微信扫码登录</Text>
                </>
              ) : (
                <WechatButton 
                  type="primary" 
                  icon={<WechatOutlined />} 
                  onClick={handleWechatLogin}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? '获取中...' : '获取登录二维码'}
                </WechatButton>
              )}
              
              <Space direction="vertical" size="small" style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  <SafetyCertificateOutlined /> 已通过ISO27001信息安全管理认证
                </Text>
                <Text type="secondary">
                  已保护10万+家庭隐私
                </Text>
              </Space>
            </Space>
          </Col>
        </Row>
      </MainContent>

      <BottomBar>
        <Space size="large">
          <QuickLink type="link" icon={<SafetyCertificateOutlined />}>焦虑自测</QuickLink>
          <QuickLink type="link" icon={<PlayCircleOutlined />}>专家直播</QuickLink>
          <QuickLink type="link" icon={<BookOutlined />}>案例库</QuickLink>
        </Space>

        <Space size="large">
          <img src="/partner-logos.png" alt="合作机构" style={{ height: '30px' }} />
        </Space>
      </BottomBar>

      {showNotice && (
        <RealTimeNotice onClick={() => setShowNotice(false)}>
          上海张妈妈刚发现孩子的运动天赋
        </RealTimeNotice>
      )}
    </StyledLayout>
  );
};

export default LoginPage;