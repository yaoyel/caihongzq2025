// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 顶部导航条组件
 * 显示返回箭头和居中标题，背景为蓝色，文字为白色
 * 
 * @param props.title 标题文本，默认为"彩虹之桥公益服务中心"
 * @param props.onBack 返回按钮点击事件
 * @param props.showRestartButton 是否显示重启自评按钮，默认为false
 * 
 * 使用示例：
 * // 基本使用
 * <Top title="页面标题" onBack={() => navigate(-1)} />
 * 
 * // 显示重启自评按钮
 * <Top 
 *   title="自评结果" 
 *   onBack={() => navigate(-1)} 
 *   showRestartButton={true} 
 * />
 * 
 * // 根据条件显示重启按钮
 * <Top 
 *   title="自评结果" 
 *   onBack={() => navigate(-1)} 
 *   showRestartButton={userInfo?.scaleAnswerCount === 168} 
 * />
 */
const Top: React.FC<{ 
  title?: string; 
  onBack?: () => void;
  showRestartButton?: boolean;
}> = ({
  title = '彩虹之桥公益服务中心',
  onBack,
  showRestartButton = false,
}) => {
  const navigate = useNavigate();

  // 重启自评按钮点击事件
  const handleRestartAssessment = () => {
    navigate('/assessment/scale168');
  };

  return (
    <div style={styles.container}>
      {/* 返回箭头 */}
      <div style={styles.back} onClick={onBack}>
        {/* SVG 左箭头图标 */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* 居中标题 */}
      <div style={styles.title}>{title}</div>
      
      {/* 重启自评按钮 */}
      {showRestartButton && (
        <div style={styles.restartButton} onClick={handleRestartAssessment}>
          重启自评
        </div>
      )}
    </div>
  );
};

// 内联样式对象，便于快速开发和复用
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    background: '#2979FF', // 设计图蓝色
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: 500,
    boxSizing: 'border-box',
    zIndex: 100,
  },
  back: {
    position: 'absolute',
    left: 16,
    top: 0,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 2,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    zIndex: 1,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: 1,
  },
  restartButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 2,
    fontSize: 14,
    fontWeight: 400,
    color: '#fff',
    padding: '0 8px',
    borderRadius: 4,
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
};

export default Top;
