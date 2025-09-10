// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography } from 'antd';
import { EditOutlined, RightOutlined, UserOutlined } from '@ant-design/icons';
import BottomNav from '../comm/bottom';
import Avatar from '../../components/Avatar';
import { getCurrentUser } from '../../config';
import './index.css';

const { Title, Text } = Typography;

/**
 * 个人信息页面组件
 * 显示用户基本信息和个人功能入口
 */
const MyPage: React.FC = () => {
  const navigate = useNavigate();

  // 处理卡片点击导航
  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const getUserInfo = async () => {
      const user = await getCurrentUser();
      setUserInfo(user.data);
    };
    getUserInfo();
  }, []);

  return (
    <div className="my-page">
      <div className="top-container">
        {/* 顶部导航条 */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="flex items-center justify-between px-4 py-3">
            {/* 返回按钮 */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* 标签页 - 居中显示 */}
            <div className="flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
              <div className="text-base font-medium transition-colors text-gray-500 hover:text-gray-700">
                个人中心
              </div>
            </div>
            <div className="flex items-right "></div>
          </div>
        </div>
      </div>
      {/* 个人信息卡片 */}
      <Card className="profile-card" style={{ marginTop: 56 }}>
        <div className="profile-content">
          {/* 头像区域 */}
          <div className="avatar-section">
            <div className="avatar-container">
              <Avatar
                size={80}
                src={userInfo?.avatarUrl}
                icon={userInfo?.avatarUrl ? userInfo.avatarUrl : <UserOutlined />}
                className="user-avatar"
              />
            </div>
          </div>

          {/* 用户信息区域 */}
          <div className="user-info">
            <div className="name-section">
              <Title level={3} className="user-name">
                {userInfo?.nickname || '学子'}
              </Title>
            </div>
            <Text className="user-id">ID: {userInfo?.id || '20230001'}</Text>
          </div>
        </div>
      </Card>

      {/* 功能卡片区域 */}
      <div className="info-cards">
        {/* 天赋评估卡片 */}
        <Card className="info-card" onClick={() => handleCardClick('/selfassessment')}>
          <div className="card-content">
            <div className="card-info">
              <Title level={4} className="card-title">
                {userInfo?.scaleAnswerCount === 168 ? '重新自评' : '开始自评'}
              </Title>
              <Text className="card-description">
                完成168题自评问卷，系统将为您分析每个专业的发展潜能分数，帮助您做出更明智的志愿选择。
              </Text>
            </div>
            <RightOutlined className="card-arrow" />
          </div>
        </Card>

        {/* 高考信息卡片 */}
        <Card className="info-card" onClick={() => handleCardClick('/basicInfo?type=my')}>
          <div className="card-content">
            <div className="card-info">
              <Title level={4} className="card-title">
                高考信息
              </Title>
              <Text className="card-description">录入和管理你的高考相关信息</Text>
            </div>
            <RightOutlined className="card-arrow" />
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={3} />
    </div>
  );
};

export default MyPage;
