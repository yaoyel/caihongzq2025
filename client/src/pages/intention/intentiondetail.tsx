import React, { useEffect } from 'react';
import BottomNav from '../comm/bottom';
import Top from '../comm/top';

const EducationalDetailPage: React.FC = () => {
  useEffect(() => {
    // 页面初始化逻辑
  }, []);

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="意向专业" onBack={() => window.history.back()} />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[18px] font-bold text-gray-900">
              意向专业-招生院校
            </div>
          </div>
        </div>

        <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3">
          <div className="flex items-center justify-between bg-[#dee9fd] rounded-t-xl p-4 px-4 py-3 mb-3">
            <div className="flex items-center">
              <span className="text-blue-600 text-lg font-bold mr-2">0002</span>
              <span className="text-blue-700 text-lg font-bold">逻辑学</span>
              <span className="ml-2 text-gray-400">&gt;</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-900 font-bold mr-1">热爱能量</span>
              <span className="text-blue-700 font-bold text-lg">98分！</span>
            </div>
          </div>
          <div className="space-y-1 p-3">
            {/* 院校信息块，严格还原设计图 */}
            {/* 第一个院校（未选中） */}
            <div className="flex items-center justify-start font-bold  mb-3 text-base">
              <div className="flex items-center">
                【<span className="text-green-600">（-5%）</span>
                <span className="text-gray-900"> 到 </span>
                <span className="text-red-600">（+5%）</span>
                <span className="text-gray-900">位次段院校</span>】
              </div>
              <div className="flex items-center ml-5">
                <span className="text-gray-900 mr-2">2所</span>
              </div>
            </div>
            <div className="border rounded-xl mb-3 overflow-hidden bg-white">
              {/* 院校头部 */}
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 text-lg font-bold">北京大学</span>
                  <span className="text-[#3cb371] text-base font-bold">985</span>
                  <span className="text-blue-500 text-base font-bold">211</span>
                  <span className="text-blue-700 text-base font-bold">双一流</span>
                </div>
                <button
                  className="bg-gray-200 text-gray-400 px-3 py-1 rounded cursor-not-allowed"
                  disabled
                >
                  备选
                </button>
              </div>
              {/* 表格内容 */}
              <div className="px-4 py-2">
                <div className="grid grid-cols-4 text-gray-500 text-sm mb-1">
                  <div>年份</div>
                  <div>最低分</div>
                  <div>最低位次</div>
                  <div>录取</div>
                </div>
                <div className="grid grid-cols-4 text-gray-900 text-base mb-1">
                  <div>2024</div>
                  <div>638</div>
                  <div>51</div>
                  <div>50人</div>
                </div>
                <div className="grid grid-cols-4 text-gray-900 text-base mb-1">
                  <div>2023</div>
                  <div>638</div>
                  <div>51</div>
                  <div>30人</div>
                </div>
                <div className="grid grid-cols-4 text-gray-900 text-base">
                  <div>2022</div>
                  <div>638</div>
                  <div>51</div>
                  <div>40人</div>
                </div>
              </div>
            </div>
            {/* 第二个院校（已选中） */}
            <div className="border rounded-xl mb-3 overflow-hidden bg-white">
              {/* 院校头部 */}
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 text-lg font-bold">北京大学</span>
                  <span className="text-[#3cb371] text-base font-bold">985</span>
                  <span className="text-blue-500 text-base font-bold">211</span>
                  <span className="text-blue-700 text-base font-bold">双一流</span>
                </div>
                <button className="bg-green-500 text-white px-3 py-1 rounded">备选</button>
              </div>
              {/* 表格内容 */}
              <div className="px-4 py-2">
                <div className="grid grid-cols-4 text-gray-500 text-sm mb-1">
                  <div>年份</div>
                  <div>最低分</div>
                  <div>最低位次</div>
                  <div>录取</div>
                </div>
                <div className="grid grid-cols-4 text-gray-900 text-base mb-1">
                  <div>2024</div>
                  <div>638</div>
                  <div>51</div>
                  <div>50人</div>
                </div>
                <div className="grid grid-cols-4 text-gray-900 text-base mb-1">
                  <div>2023</div>
                  <div>638</div>
                  <div>51</div>
                  <div>30人</div>
                </div>
                <div className="grid grid-cols-4 text-gray-900 text-base">
                  <div>2022</div>
                  <div>638</div>
                  <div>51</div>
                  <div>40人</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default EducationalDetailPage;
