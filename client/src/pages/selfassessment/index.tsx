import React, { useState, useEffect } from 'react';
import BottomNav from '../comm/bottom';
import Top from '../comm/top';
import { Button, Spin } from 'antd';
import './startWelcome.css'; // 引入自定义样式
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../config';
import Scale168Assessment from '../assessment/scale-168'; // 导入168题评估组件

const SelfassessmentPage: React.FC = () => {
  const navigate = useNavigate();
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
          ) : userInfo && userInfo.scaleAnswerCount === 168 ? (
            // 已完成168题时直接渲染评估组件
            <div className="w-full">
              <Scale168Assessment />
            </div>
          ) : (
            // 正常显示自评页面内容
            <div className="home-content">
              {/* 热爱标题及说明 */}
              <div className="home-title">热爱</div>
              <div className="home-desc">
                不论高考成绩如何，本问卷都会助您找到喜欢且擅长的专业！
                <br />
                愿您以高考为起点，培养&ldquo;热爱的种子&rdquo;，越来越
                <span className="home-highlight">自由自在的心想事成！</span>
              </div>

              {/* 从心出发标题及说明 */}
              <div className="home-title">从心出发</div>
              <ol className="home-list">
                <li>
                  1.问卷涉及多维度、168道题，请务必预留
                  <span className="home-highlight">45分钟</span>左右整段安静时间。
                </li>
                <li>
                  2.根据&ldquo;第一感觉&rdquo;或回顾，选择&ldquo;最像自己&rdquo;的选项即可，无需过多考虑。
                </li>
                <li>
                  <span className="home-highlight">3.本问卷仅限考生本人作答！</span>
                </li>
              </ol>

              {/* 启动按钮 */}
              <Button
                type="primary"
                className="home-btn"
                size="large"
                onClick={() => navigate('/assessment/scale168')}
              >
                开启自评
              </Button>
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
