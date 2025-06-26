import React, { useEffect } from 'react';
import { Card, Spin } from 'antd';
import { LoadingOutlined, ToolOutlined } from '@ant-design/icons';
import BottomNav from '../comm/bottom';
import StartWelcomePage from '../comm/startWelcome';
import Top from '../comm/top';

const EducationalPage: React.FC = () => {
  useEffect(() => {
    // 页面初始化逻辑
  }, []);
  const scaleAnswerCount = localStorage.getItem('scaleAnswerCount');
  if (scaleAnswerCount !== '168') {
    return (
      <>
        <StartWelcomePage />
        <BottomNav selectedIndex={2} />
      </>
    );
  }

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="意向选择" onBack={() => window.history.back()} />
      <div className="bg-[#f7f7fa] flex justify-center items-start p-3 min-h-screen">
        {/* 页面主卡片 */}
        <Card
          className="rounded-2xl w-full max-w-xl shadow-lg"
          bodyStyle={{ padding: '32px 24px' }}
        >
          {/* 开发中提示内容 */}
          <div className="text-center py-8">
            {/* 图标区域 */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                <ToolOutlined className="text-3xl text-blue-600" />
              </div>
            </div>

            {/* 标题 */}
            <h2 className="text-xl font-semibold text-gray-800 mb-3">功能开发中</h2>

            {/* 描述文字 */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              意向选择功能正在精心开发中，
              <br />
              我们将为您提供最优质的意向推荐服务
            </p>

            {/* 加载动画 */}
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
              <span className="text-sm">开发进度 75%</span>
            </div>

            {/* 预计上线时间 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-medium">预计上线时间：</span>
                2025年7月1
              </p>
            </div>
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav
        selectedIndex={2}
        onSelect={() => {
          window.location.href = '/educational';
        }}
      />
    </div>
  );
};

export default EducationalPage;
