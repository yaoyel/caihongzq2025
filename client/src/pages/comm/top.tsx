// @ts-nocheck
import React from 'react';

/**
 * 顶部导航条组件
 * 显示返回箭头和居中标题，背景为蓝色，文字为白色
 * @param props.title 标题文本，默认为"彩虹之桥公益服务中心"
 * @param props.onBack 返回按钮点击事件
 */
const Top: React.FC<{ title?: string; onBack?: () => void }> = ({
  title = '彩虹之桥公益服务中心',
  onBack,
}) => {
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
};

export default Top;
