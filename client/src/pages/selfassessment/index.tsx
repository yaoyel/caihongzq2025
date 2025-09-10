import React, { useState, useEffect } from 'react';
import BottomNav from '../comm/bottom';
import Top from '../comm/top';
import { Spin } from 'antd';
import './startWelcome.css'; // 引入自定义样式
import { getCurrentUser } from '../../config';
import Scale168Assessment from '../assessment/scale-168'; // 导入168题评估组件

const SelfassessmentPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((res) => {
      console.log(res.data);
      setUserInfo(res?.data);
      setIsLoading(false);
    });
  }, []);

  // // 当加载完成且用户已完成168题时自动跳转
  // useEffect(() => {
  //   if (!isLoading && userInfo && userInfo.scaleAnswerCount === 168) {
  //     navigate('/assessment/scale168');
  //   }
  // }, [isLoading, userInfo, navigate]);

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <>
        <Top
          title={userInfo?.scaleAnswerCount !== 168 ? '自评' : '自评结果'}
          onBack={() => window.history.back()}
          showRestartButton={userInfo?.scaleAnswerCount === 168}
        />
        <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
          {isLoading ? (
            // 加载状态显示
            <div className="flex flex-col justify-center items-center min-h-screen">
              <Spin size="large" />
              <div className="mt-4 text-gray-600">加载中...</div>
            </div>
          ) : (
            <div className="w-full">
              <Scale168Assessment />
            </div>
          )}
        </div>
      </>

      <BottomNav
        selectedIndex={0}
        onSelect={() => {
          window.location.href = '/educational';
        }}
      />
    </div>
  );
};

export default SelfassessmentPage;
