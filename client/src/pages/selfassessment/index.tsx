import React from 'react';
import BottomNav from '../comm/bottom';
import Top from '../comm/top';
import { Button } from 'antd';
import './startWelcome.css'; // 引入自定义样式
import { useNavigate } from 'react-router-dom';

const SelfassessmentPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="院校选择" onBack={() => window.history.back()} />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        <div className="home-content">
          {/* 热爱标题及说明 */}
          <div className="home-title">热爱</div>
          <div className="home-desc">
            不论高考成绩如何，本问卷都会助您找到喜欢且擅长的专业！
            <br />
            愿您以高考为起点，培养"热爱的种子"，越来越
            <span className="home-highlight">自由自在的心想事成！</span>
          </div>

          {/* 从心出发标题及说明 */}
          <div className="home-title">从心出发</div>
          <ol className="home-list">
            <li>
              1.问卷涉及多维度、168道题，请务必预留
              <span className="home-highlight">45分钟</span>左右整段安静时间。
            </li>
            <li>2.根据"第一感觉"或回顾，选择"最像自己"的选项即可，无需过多考虑。</li>
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
      </div>
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
