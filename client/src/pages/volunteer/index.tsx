import React, { useEffect } from 'react';
import { Card, Spin } from 'antd';
import { LoadingOutlined, ToolOutlined } from '@ant-design/icons';
import BottomNav from '../comm/bottom';
import StartWelcomePage from '../selfassessment/startWelcome';
import Top from '../comm/top';

const EducationalPage: React.FC = () => {
  useEffect(() => {
    // 页面初始化逻辑
  }, []);
  const scaleAnswerCount = localStorage.getItem('scaleAnswerCount');
  console.log(scaleAnswerCount, 'scaleAnswerCount');
  if (scaleAnswerCount && Number(scaleAnswerCount) !== 168) {
    return (
      <>
        <StartWelcomePage />
        <BottomNav selectedIndex={3} />
      </>
    );
  }
  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="备选志愿" onBack={() => window.history.back()} />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-3">
          <div className="flex items-center justify-start">
            <div className="flex items-center text-[18px] font-bold text-gray-900">备选志愿</div>
            <div className="text-blue-600 text-[22px] font-bold">100个</div>
          </div>
        </div>

        <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-4">
          {/* 学校与基本信息 */}
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-[18px] font-bold text-gray-900">北京大学</span>
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded">985</span>
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded">211</span>
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded">双一流</span>
            </div>
            {/* 右侧预留空白或可加图标 */}
          </div>

          {/* 专业与热爱能量 */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
              <span className="text-blue-700 font-bold text-[16px] mr-2">0002 逻辑学</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-xs font-bold">热爱能量98分！</span>
              <button className="bg-green-500 text-white text-xs px-3 py-1 rounded">入选</button>
            </div>
          </div>

          {/* 历年分数表格 */}
          <div className="mt-3">
            <div className="flex text-gray-500 text-xs border-b pb-1">
              <div className="w-1/5">年份</div>
              <div className="w-1/5">最低分</div>
              <div className="w-1/5">最低位次</div>
              <div className="w-1/5">录取</div>
              <div className="w-1/5"></div>
            </div>
            {/* 表格数据 */}
            <div className="flex text-gray-900 text-sm py-1 border-b">
              <div className="w-1/5">2024</div>
              <div className="w-1/5">638</div>
              <div className="w-1/5">51</div>
              <div className="w-1/5">50人</div>
              <div className="w-1/5"></div>
            </div>
            <div className="flex text-gray-900 text-sm py-1 border-b">
              <div className="w-1/5">2023</div>
              <div className="w-1/5">638</div>
              <div className="w-1/5">51</div>
              <div className="w-1/5">30人</div>
              <div className="w-1/5"></div>
            </div>
            <div className="flex text-gray-900 text-sm py-1">
              <div className="w-1/5">2022</div>
              <div className="w-1/5">638</div>
              <div className="w-1/5">51</div>
              <div className="w-1/5">40人</div>
              <div className="w-1/5"></div>
            </div>
          </div>

          {/* 点击展开 */}
          <div className="mt-2 text-blue-600 text-xs cursor-pointer">点击展开</div>
        </div>
      </div>
      {/* 底部导航 */}
      <BottomNav
        selectedIndex={3}
        onSelect={() => {
          window.location.href = '/educational';
        }}
      />
    </div>
  );
};

export default EducationalPage;
