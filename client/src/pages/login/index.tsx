// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Button,
  Row,
  Col,
  Space,
  Card,
  message,
  Spin,
  Menu,
  Dropdown,
} from 'antd';
import {
  WechatOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';
import Avatar from '../../components/Avatar';

const { Title, Text } = Typography;
const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(45deg, #89c4f4 0%, #c7f4d3 100%);
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
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
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
  background: #ffb347;
  border-color: #ffb347;
  box-shadow: 0 4px 12px rgba(255, 179, 71, 0.3);

  &:hover {
    background: #ffa533;
    border-color: #ffa533;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  animation: pulse 2s infinite;
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
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;

const GrowthStages = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  min-height: 600px;
  margin-top: 100px;
`;

const StageCard = styled.div`
  opacity: 0;
  transform: translateY(20px);
  animation: fadeIn 0.6s forwards;
  padding: 24px;
  background: #f8f9ff;
  border-radius: 12px;
  margin-bottom: 24px;
  border-left: 4px solid #1890ff;

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:nth-child(1) {
    animation-delay: 0.2s;
  }
  &:nth-child(2) {
    animation-delay: 0.4s;
  }
  &:nth-child(3) {
    animation-delay: 0.6s;
  }
  &:nth-child(4) {
    animation-delay: 0.8s;
  }
  &:nth-child(5) {
    animation-delay: 1s;
  }
`;

const StageTitle = styled.h3`
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StageContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  font-size: 14px;
  margin-top: 12px;
`;

const StageSubItem = styled.div`
  padding: 8px;
  background: #f8f9ff;
  border-radius: 6px;
  position: relative;
  &::before {
    content: '▫️';
    margin-right: 8px;
  }
`;

const StageItem = styled.div`
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ScrollContainer = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding-right: 8px;
  margin-top: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #1890ff;
    border-radius: 3px;
  }
`;

const InteractionItem = styled.div`
  padding: 8px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  animation: slideIn 0.5s ease-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const loveInteractions = [
  '不轻易打断孩子说话',
  '能尝试感受孩子心里的感受',
  '能让孩子体验到被尊重、被理解',
  '孩子有好想法马上响应',
  '表达时尽量简洁',
  '说话时先说重点',
  '尽量用孩子明白的话表达',
  '没说明白时，尝试用孩子熟悉的事物举例子、打比方',
  '认同时及时表达欣赏',
  '回应时重述孩子原话或关键词',
  '自己有好想法不着急表达',
  '不懂的地方能向孩子请教',
  '看法不一致很正常，各自保留看法也是共识',
  '不认同时不着急提出，先听、多想想，再提出完善建议',
  '分享时尽量只说确认过的事实、验证过的规律',
  '不断确认与孩子有共识的点',
];

const talentScenes = [
  '玩什么游戏时孩子会不愿意停下来？',
  '干什么的时候孩子经常不专心？',
  '遇到什么时孩子会不由自主的被吸引？',
  '什么情形下孩子会显得很生气？',
  '什么情形下孩子会非常不高兴？',
  '什么情形下孩子会很快高兴起来？',
  '什么情形下孩子会安静很长时间？',
  '什么情形下孩子会接受不想做的事？',
  '没有玩具玩时孩子会做什么？',
  '什么时候孩子会不愿意学习？',
  '什么情形下孩子会发出高兴的笑声？',
  '什么情形下孩子会愿意一个人呆着？',
  '孩子在遇到回答不了的问题时的反应通常是？',
  '孩子在面对什么困难时会自己尝试解决，不会马上求助大人？',
  '孩子不乐意回答哪些方面的问题？',
  '参加什么活动时孩子最开心？',
  '孩子做什么事时最喜欢动脑筋？',
  '做什么事时孩子愿意向大人请教方法？',
  '能让孩子不断发问的是哪些方面的问题？',
  '孩子在追问什么问题时思路最清晰？',
  '学什么的过程中孩子会一直很高兴？',
  '孩子在帮大人做什么事时最有耐心？',
  '什么事能让孩子放下喜欢的玩具主动去做？',
  '什么情况下孩子会愿意与其他小朋友分享最喜欢的玩具？',
  '什么情况下得到奖品孩子最高兴？',
  '不需奖励孩子就能主动去做的事是？',
  '孩子学起来最快最省力的学科是？',
  '孩子看到后觉得很向往的人物或事情是？',
  '孩子喜欢用什么方式获取知识？',
  '孩子聊什么时比平时更愿意表达？',
  '孩子描绘什么时很多细节刻画？',
  '孩子讲述什么时可以大段引用原话？',
  '干什么时孩子会成为小朋友的模仿对象？',
  '孩子相对轻松就能做出好结果的是哪方面的事？',
  '孩子不需教就能掌握得不错的是哪方面的知识？',
  '什么事上孩子总能带领小朋友一起玩？',
];

const LoginContainer = styled.div`
  @media (max-width: 768px) {
    .ant-card {
      width: 100%;
      margin: 0;
      border-radius: 0;
      box-shadow: none;
    }

    .ant-card-body {
      padding: 16px;
    }

    .login-form {
      display: none;
    }

    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      background: #fff;
    }

    .qr-box {
      width: 280px;
      height: 280px;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 20px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .qr-tip {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 16px;
    }
  }
`;

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
      const response = await axios.get(`${getApiUrl('/wechat/qrcode')}`);
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
      const { ticket, sceneStr, qrUrl, isTest } = response.data.data;

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

  // 修改 startPolling 函数
  const startPolling = (scene: string) => {
    setPolling(true);
    let pollingTimer: NodeJS.Timeout;

    const checkLogin = async () => {
      try {
        const response = await axios.get(`${getApiUrl(`/wechat/check-login?scene=${scene}`)}`);
        console.log(response);
        const { success, user, token } = response.data.data;
        if (success) {
          // 清除轮询定时器
          clearInterval(pollingTimer);
          setPolling(false);

          // 存储用户信息和token
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', token);

          // 设置全局请求头
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          message.success('登录成功');
          navigate('/home');
          return true; // 登录成功返回 true
        }
        return false; // 未登录返回 false
      } catch (error) {
        console.error('登录检查失败:', error);
        clearInterval(pollingTimer);
        setPolling(false);
        message.error('登录检查失败，请重试');
        return true; // 发生错误也返回 true 以停止轮询
      }
    };

    // 启动轮询
    pollingTimer = setInterval(async () => {
      const shouldStop = await checkLogin();
      if (shouldStop) {
        clearInterval(pollingTimer);
        setPolling(false);
      }
    }, 2000);

    // 返回清理函数
    return () => {
      clearInterval(pollingTimer);
      setPolling(false);
    };
  };

  // 检查本地存储并尝试自动登录
  useEffect(() => {
    const checkLocalAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        // 如果没有本地认证信息，显示二维码
        getLoginQrCode();
        return;
      }

      try {
        const user = JSON.parse(userStr);
        setUserInfo(user);

        // 设置全局请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // 获取用户信息
        const response = await axios.get(getApiUrl('/users/me'));

        if (response.status === 200) {
          // 更新用户信息
          localStorage.setItem('user', JSON.stringify(response.data));
          navigate('/default');
          return;
        }
      } catch (error: any) {
        console.error('自动登录失败:', error);

        if (error.response?.status === 401) {
          // 清除无效的认证信息
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUserInfo(null);
        }

        // 如果获取用户信息失败，显示二维码
        getLoginQrCode();
      }
    };

    // localStorage.setItem(
    //   'token',
    //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsIm5pY2tuYW1lIjoi5bqE5Lqu5LquIiwiYXZhdGFyVXJsIjoiIiwiaWF0IjoxNzUwMDMzMjY1LCJleHAiOjE3NTI2MjUyNjV9.xnIxZ6lrDQLk-cdyQlHSJ01b4m49Fd57YtwBXhCBvxg'
    // );
    // localStorage.setItem(
    //   'user',
    //   JSON.stringify({
    //     id: 6,
    //     username: '',
    //     nickname: '',
    //     avatarUrl: '',
    //     role: 'parent',
    //   })
    // );
    checkLocalAuth();
  }, [navigate]);

  const handleWechatLogin = () => {
    if (!polling) {
      getLoginQrCode();
    }
  };

  return (
    <LoginContainer>
      <Card className="login-card">
        <div className="login-form">
          <Row gutter={48} align="top">
            <Col span={12}>
              <GrowthStages>
                <Title level={2} style={{ marginBottom: 32, color: '#1890ff' }}>
                  🌱 五道杠成长体系
                </Title>

                {[
                  {
                    stage: '第一阶段',
                    title: '自我觉察（自然探索）',
                    timing: '自然而然时',
                    target: '发现喜欢与天赋',
                    abilities: [
                      '发展自信与自驱',
                      '基础情绪能力：感知兴趣带来的愉悦感',
                      '原始动力：无压力状态下的主动尝试',
                    ],
                  },
                  {
                    stage: '第二阶段',
                    title: '自我认知（选择培养）',
                    timing: '需要付出努力时',
                    target: '在喜欢的方向中培养自主选择能力，在天赋方向中寻找天赋长项',
                    abilities: [
                      '发展自强与自律',
                      '决策能力：基于兴趣的优先级判断',
                      '延迟满足：为天赋发展承受短期压力',
                    ],
                  },
                  {
                    stage: '第三阶段',
                    title: '自我突破（能力锻造）',
                    timing: '需要克服困难时',
                    target: '在自主选择的方向上自愿坚持，在天赋长项中培养独立思考的能力',
                    abilities: [
                      '发展韧性（抗压 + 坚持）与思辨',
                      '抗压性：将困难转化为具体可执行步骤',
                      '逻辑验证：用天赋能力反向推导问题本质',
                    ],
                  },
                  {
                    stage: '第四阶段',
                    title: '自我蜕变（创新实践）',
                    timing: '需要战胜挑战时',
                    target: '在自愿坚持的方向上自我完善，独立思考后自主创新',
                    abilities: [
                      '发展系统化（整合 + 创新）与预见性',
                      '模式重构：将前两阶段积累的经验模块化',
                      '风险预判：基于天赋特质的创新可行性评估',
                    ],
                  },
                  {
                    stage: '第五阶段',
                    title: '自我超越（认知升级）',
                    timing: '需要面对挫折时',
                    target: '将自我完善发展成自我发现，自主创新后发现规律',
                    abilities: [
                      '发展元认知（规律洞察 + 自我迭代）',
                      '认知升维：建立跨领域的能力迁移框架',
                      '动态校准：用失败数据优化天赋应用模型',
                    ],
                  },
                ].map((phase, index) => (
                  <StageCard key={index}>
                    <StageTitle>
                      <SafetyCertificateOutlined />
                      {phase.stage}：{phase.title}
                    </StageTitle>
                    <StageContent>
                      <StageItem>
                        <Text strong>🕒 时机：</Text>
                        {phase.timing}
                      </StageItem>

                      <StageItem>
                        <Text strong>🎯 核心目标：</Text>
                        {phase.target}
                      </StageItem>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <Text strong>🚀 能力提升：</Text>
                        <div style={{ marginTop: 8 }}>
                          {phase.abilities.map((ability, subIndex) => (
                            <StageSubItem key={subIndex}>
                              {subIndex === 0 ? <strong>{ability}</strong> : ability}
                            </StageSubItem>
                          ))}
                        </div>
                      </div>
                    </StageContent>
                  </StageCard>
                ))}
              </GrowthStages>
            </Col>

            <Col
              span={12}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '100px',
              }}
            >
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
                    <div className="qr-box">
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
                            objectFit: 'contain',
                          }}
                          onError={() => {
                            setError('二维码加载失败');
                            setQrUrl('');
                          }}
                        />
                      )}
                    </div>
                    <div className="qr-tip">
                      <Text type="secondary">请长按二维码，使用微信扫描登录测评系统</Text>
                    </div>
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

                <div style={{ width: '100%', marginTop: 40 }}>
                  <Row gutter={[24, 24]}>
                    <Col span={24}>
                      <Card
                        title={<div style={{ color: '#1890ff' }}>❤️ 爱的互动指南（16条）</div>}
                        bordered={false}
                      >
                        <div style={{ paddingRight: '8px' }}>
                          {loveInteractions.map((item, index) => (
                            <InteractionItem key={`love-${index}`}>
                              <Text>▫️ {item}</Text>
                            </InteractionItem>
                          ))}
                        </div>
                      </Card>
                    </Col>

                    <Col span={24}>
                      <Card
                        title={<div style={{ color: '#1890ff' }}>🔍 天赋发现场景（36个）</div>}
                        bordered={false}
                      >
                        <ScrollContainer>
                          {talentScenes.map((item, index) => (
                            <InteractionItem key={`scene-${index}`}>
                              <Text strong>{index + 1}.</Text> {item}
                            </InteractionItem>
                          ))}
                        </ScrollContainer>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Space>
            </Col>
          </Row>
        </div>
        <div className="qr-container">
          {error ? (
            <div style={{ textAlign: 'center' }}>
              <Text type="danger">{error}</Text>
              <br />
              <Button type="primary" onClick={() => getLoginQrCode()} style={{ marginTop: '16px' }}>
                重试
              </Button>
            </div>
          ) : qrUrl ? (
            <>
              <div className="qr-box">
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
                      objectFit: 'contain',
                    }}
                    onError={() => {
                      setError('二维码加载失败');
                      setQrUrl('');
                    }}
                  />
                )}
              </div>
              <div className="qr-tip">
                <Text type="secondary">请长按二维码，使用微信扫描登录测评系统</Text>
              </div>
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
        </div>
      </Card>
    </LoginContainer>
  );
};

export default LoginPage;
