import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './startWelcome.css'; // 引入自定义样式

/**
 * 首页说明组件，严格还原设计图
 */
const StartWelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-bg">
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
  );
};

export default StartWelcomePage;
