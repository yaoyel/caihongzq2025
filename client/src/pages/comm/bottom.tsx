import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutline, UserCircleOutline } from 'antd-mobile-icons';
import aspiration_blue from '../../public/aspiration_blue.png';
import aspiration_grey from '../../public/aspiration_grey.png';
import major_blue from '../../public/major_blue.png';
import major_grey from '../../public/major_grey.png';
import selfAssessmentBlue from '../../public/self-assessment-blue.svg';
import selfAssessmentGrey from '../../public/self-assessment-grey.svg';

/**
 * 底部导航栏组件
 * @param {number} selectedIndex 当前选中项索引（0-3）
 * @param {(index: number) => void} onSelect 选中项切换回调
 */
const navItems = [
  {
    label: '推荐',
    blueIcon: selfAssessmentBlue,
    greyIcon: selfAssessmentGrey,
    isIcon: false, // 标识是否为图标组件
  },
  {
    label: '专业',
    blueIcon: major_blue,
    greyIcon: major_grey,
    isIcon: false,
  },
  // {
  //   label: '意向',
  //   blueIcon: intention_blue,
  //   greyIcon: intention_grey,
  // },
  {
    label: '志愿',
    blueIcon: aspiration_blue,
    greyIcon: aspiration_grey,
    isIcon: false,
  },
  {
    label: '我的',
    blueIcon: UserCircleOutline, // 使用 Antd Mobile 图标组件 - 选中状态
    greyIcon: UserOutline, // 未选中状态
    isIcon: true, // 标识为图标组件
  },
];

interface BottomNavProps {
  selectedIndex: number;
  onSelect?: (index: number) => void;
}

/**
 * 底部导航栏
 */
const BottomNav: React.FC<BottomNavProps> = ({ selectedIndex }) => {
  const navigator = useNavigate();
  return (
    <nav
      style={{
        width: '100%',
        height: 80,
        borderTop: '1px solid #f0f0f0',
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'fixed',
        left: 0,
        bottom: 0,
        zIndex: 1,
      }}
    >
      {navItems.map((item, idx) => {
        let path = '';
        switch (idx) {
          case 0:
            // path = '/selfassessment';
            path = '/volunteer/aiVolunteer';
            break;
          case 1:
            path = '/major/list';
            break;
          case 2:
            path = '/volunteer';
            break;
          case 3:
            path = '/my';
            break;
        }

        return (
          <div
            key={item.label}
            onClick={() => navigator(path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {/* 图标 */}
            {item.isIcon ? (
              // 使用 Antd Mobile 图标组件
              <div
                style={{
                  width: 32,
                  height: 32,
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedIndex === idx ? (
                  <item.blueIcon style={{ fontSize: 30, color: '#2563eb' }} />
                ) : (
                  <item.greyIcon style={{ fontSize: 30, color: '#666' }} />
                )}
              </div>
            ) : (
              // 使用图片图标
              <img
                src={selectedIndex === idx ? item.blueIcon : item.greyIcon}
                alt={item.label}
                style={{
                  width: 32,
                  height: 32,
                  marginBottom: 4,
                }}
              />
            )}
            {/* 文字 */}
            <span
              style={{
                fontSize: 20,
                color: selectedIndex === idx ? '#2563eb' : '#666',
                fontWeight: selectedIndex === idx ? 500 : 400,
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
