// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Modal, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import BottomNav from '../comm/bottom';
import StartWelcomePage from '../comm/startWelcome';
import aspiration_blue from '../../public/aspiration_blue.png';
import aspiration_grey from '../../public/aspiration_grey.png';
import intention_blue from '../../public/intention_blue.png';
import intention_grey from '../../public/intention_grey.png';
import major_blue from '../../public/major_blue.png';
import major_grey from '../../public/major_grey.png';
import school_blue from '../../public/school_blue.png';
import school_grey from '../../public/school_grey.png';

import {
  getApiUrl,
  getUserMajorScores,
  getMajorDetail,
  createWechatPayOrder,
  callWechatPay,
} from '../../config';
import './list.css'; // 可根据需要自定义样式

/**
 * 最爱专业页面组件
 */
const MajorPage: React.FC = () => {
  const scaleAnswerCount = localStorage.getItem('scaleAnswerCount');
  console.log(scaleAnswerCount, 'scaleAnswerCount');
  const navigator = useNavigate();
  // 原始专业列表数据
  const [originalMajors, setOriginalMajors] = useState<any[]>([]);
  // 当前显示的专业列表数据（经过搜索过滤）
  const [majors, setMajors] = useState<any[]>([]);
  // 搜索框内容
  const [searchValue, setSearchValue] = useState('');
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30); // 每页显示30条记录
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // 计算当前实际要渲染的专业数据
  const displayMajors = majors.slice(0, currentPage * pageSize);

  // 在组件内添加ref
  const listAreaRef = useRef<HTMLDivElement>(null);

  /**
   * 获取专业分数数据
   */
  const fetchMajorScores = async (isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(1); // 重置页码
    }

    try {
      const userStr = localStorage.getItem('new-user');
      if (!userStr) {
        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setLoading(false);
        }
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user?.id ?? user?.data?.id;

      const response = await getUserMajorScores(userId);

      if (response && response.code === 200) {
        // 获取所有分数数据
        const scores = (response.data && response.data.scores) || [];

        if (isLoadMore) {
          // 加载更多：追加数据
          setOriginalMajors((prev) => [...prev, ...scores]);
          setMajors((prev) => [...prev, ...scores]);
        } else {
          // 首次加载：替换数据
          setOriginalMajors(scores);
          setMajors(scores);
        }

        // 检查是否还有更多数据
        setHasMore(scores.length >= pageSize);
      } else {
        message.error(response.message || '获取专业分数失败');
      }
    } catch (error) {
      console.error('获取专业分数失败:', error);
      message.error('获取专业数据失败，请稍后重试');
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMajorScores();
  }, []);

  // 修改分页判断逻辑
  useEffect(() => {
    setHasMore(majors.length > currentPage * pageSize);
  }, [majors, currentPage, pageSize]);

  // 滚动监听，实现自动加载更多（监听内部容器）
  useEffect(() => {
    const area = listAreaRef.current;
    if (!area) return;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (
          hasMore &&
          !loading &&
          !isLoadingMore &&
          area.scrollTop + area.clientHeight >= area.scrollHeight - 100
        ) {
          setCurrentPage((prev) => prev + 1);
        }
        ticking = false;
      });
    };
    area.addEventListener('scroll', handleScroll);
    return () => area.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, isLoadingMore]);

  // 容器高度不足时自动加载
  useEffect(() => {
    const area = listAreaRef.current;
    if (
      area &&
      hasMore &&
      !loading &&
      !isLoadingMore &&
      area.scrollHeight <= area.clientHeight + 100
    ) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [displayMajors.length, hasMore, loading, isLoadingMore]);

  /**
   * 模糊搜索功能
   * @param searchText 搜索文本
   * @param data 要搜索的数据
   * @returns 过滤后的数据
   */
  const filterMajors = (searchText: string, data: any[]) => {
    if (!searchText.trim()) {
      return data; // 如果搜索框为空，返回所有数据
    }

    const searchLower = searchText.toLowerCase().trim();

    return data.filter((item: any) => {
      // 搜索专业代码（转换为字符串进行搜索）
      const majorCodeStr = String(item.majorCode || '');
      // 搜索专业名称
      const majorNameStr = String(item.majorName || '');

      return (
        majorCodeStr.toLowerCase().includes(searchLower) ||
        majorNameStr.toLowerCase().includes(searchLower)
      );
    });
  };

  /**
   * 处理搜索输入变化
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // 重置分页状态
    setCurrentPage(1);
    setHasMore(true);

    // 实时搜索：根据输入内容过滤数据
    const filteredData = filterMajors(value, originalMajors);
    setMajors(filteredData);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 获取用户openid
  const getUserOpenid = () => {
    try {
      const userStr = localStorage.getItem('new-user');
      if (!userStr) {
        return null;
      }
      const user = JSON.parse(userStr);
      return user?.openid || user?.data?.openid;
    } catch (error) {
      console.error('获取用户openid失败:', error);
      return null;
    }
  };

  // 处理支付
  const handlePayment = async () => {
    try {
      setPayLoading(true);

      // 获取用户openid
      const openid = getUserOpenid();
      if (!openid) {
        message.error('请先登录微信账号');
        setIsModalVisible(false);
        return;
      }

      // 支付金额：88元 = 8800分
      const amount = 1;

      // 调用微信支付
      const paySuccess = await callWechatPay(openid, amount);

      if (paySuccess) {
        message.success('支付成功！');
        //重新加载页面
        setLoading(true);
        message.loading('正在帮您解锁所有专业报告', 0);
        await fetchMajorScores();
        message.destroy();
        setIsModalVisible(false);
        // 这里可以添加支付成功后的逻辑，比如刷新数据或跳转页面
      } else {
        message.info('支付已取消');
      }
    } catch (error: any) {
      console.error('支付失败:', error);
      message.error(error.message || '支付失败，请重试');
    } finally {
      setPayLoading(false);
    }
  };

  /**
   * 清空搜索
   */
  const handleClearSearch = () => {
    setSearchValue('');
    setCurrentPage(1);
    setHasMore(true);
    setMajors(originalMajors); // 恢复显示所有专业
  };

  /**
   * 切换收藏状态
   */
  const toggleFavorite = (id: number) => {
    // 同时更新原始数据和当前显示数据
    setOriginalMajors((prev: any) =>
      prev.map((item: any) =>
        item.majorCode === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );

    setMajors((prev: any) =>
      prev.map((item: any) =>
        item.majorCode === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  /**
   * 搜索按钮点击事件处理
   */
  const handleSearch = () => {
    // 搜索按钮点击时，重新执行搜索（虽然已经实时搜索了，这里可以添加额外逻辑）
    const filteredData = filterMajors(searchValue, originalMajors);
    setMajors(filteredData);

    // 可以在这里添加搜索提示
    if (searchValue.trim() && filteredData.length === 0) {
      message.info('未找到匹配的专业');
    }
  };

  /**
   * 重新加载数据
   */
  const handleRefresh = () => {
    fetchMajorScores();
  };

  /**
   * 截断专业名称，超过6个字符时用省略号表示
   * @param name 专业名称
   * @returns 截断后的专业名称
   */
  const truncateMajorName = (name: string) => {
    if (!name) return '';
    return name.length > 6 ? name.substring(0, 6) + '...' : name;
  };
  if (scaleAnswerCount && Number(scaleAnswerCount) !== 168) {
    return (
      <>
        <StartWelcomePage />
        <BottomNav selectedIndex={1} />
      </>
    );
  }

  return (
    <div className="page-bg text-gray-900">
      {/* 顶部搜索栏 */}
      <div
        className="major-search-bar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          padding: '24px 16px 8px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <SearchOutlined style={{ fontSize: 26, marginRight: 8 }} />
        <Input
          placeholder={'请搜索您"最爱"专业'}
          value={searchValue}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          style={{
            flex: 1,
            borderRadius: 20,
            background: '#f2f2f2',
            border: 'none',
            height: 36,
            lineHeight: '16px',
            fontSize: '16px',
          }}
          allowClear
        />
        <Button
          type="primary"
          shape="round"
          style={{ marginLeft: 12, width: 64, height: 36, background: '#2563eb', border: 'none' }}
          onClick={handleSearch}
        >
          搜索
        </Button>
      </div>

      {/* 为固定搜索栏留出空间 */}
      <div style={{ height: '68px' }}></div>

      {/* 滚动容器 */}
      <div
        className="major-list-card-area"
        ref={listAreaRef}
        style={{ height: 'calc(100vh - 148px)', overflow: 'auto' }}
      >
        {/* 专业列表卡片 */}
        <div
          className="major-list-card"
          style={{
            background: '#fff',
            borderRadius: 16,
            margin: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            minWidth: 'calc(100% - 32px)',
          }}
        >
          {/* 标题 */}
          <div
            style={{
              fontWeight: 700,
              fontSize: 20,
              padding: '16px 0 8px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 4,
                  height: 20,
                  background: '#2563eb',
                  borderRadius: 2,
                  marginRight: 8,
                }}
              />
              最爱专业
            </div>
            {/* 搜索结果提示 */}
            {searchValue.trim() ? (
              <div style={{ fontSize: 14, color: '#666', fontWeight: 400 }}>
                找到 {majors.length} 个专业
              </div>
            ) : majors.length > 0 ? (
              <div style={{ fontSize: 14, color: '#666', fontWeight: 400 }}>
                已加载 {displayMajors.length} / {majors.length} 个专业
                {hasMore && <span style={{ color: '#999' }}>，滚动加载更多...</span>}
              </div>
            ) : null}
          </div>
          {/* 列表内容 */}
          <div>
            {loading ? (
              // 加载中状态
              <div
                style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: 16,
                }}
              >
                <Spin size="large" style={{ marginBottom: 16 }} />
                <div>正在加载专业数据...</div>
                <div style={{ fontSize: 14, marginTop: 8, color: '#999' }}>
                  请稍候，正在为您获取最爱专业信息
                </div>
              </div>
            ) : majors.length > 0 ? (
              displayMajors.map((item: any, idx: number) => (
                <div
                  key={item.majorCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    height: 44,
                    borderBottom: idx === displayMajors.length - 1 ? 'none' : '1px solid #f0f0f0',
                    fontSize: 14,
                    color: '#333',
                  }}
                >
                  {/* 序号蓝色圆角 */}
                  {/* <div
                    style={{
                      width: 23,
                      height: 20,
                      background: `url(${numBg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      color: '#fff',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      marginRight: 8,
                    }}
                  >
                    {idx + 1}
                  </div> */}
                  <div
                    onClick={() =>
                      navigator(
                        `/major/majorlovedetail?majorCode=${item.majorCode}&&majorName=${item.majorName}&score=${item.score}&lexueScore=${item.lexueScore}&shanxueScore=${item.shanxueScore}&yanxueDeduction=${item.yanxueDeduction}&tiaozhanDeduction=${item.tiaozhanDeduction}`
                      )
                    }
                    style={{ flex: 1 }}
                  >
                    {/* 专业编号和名称 */}
                    <span style={{ color: '#666', marginRight: 8 }}>{item.majorCode}</span>
                    <span style={{ marginRight: 15 }} title={item.majorName}>
                      {truncateMajorName(item.majorName)}
                    </span>
                    {/* 跳转箭头 */}
                    <span style={{ color: '#bbb', fontSize: 18 }}>{'>'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* 热爱能量 */}
                    <span style={{ color: '#333', fontSize: 15, marginRight: 8 }}>
                      热爱能量{Math.ceil(item.score * 100)}分！
                    </span>
                    {/* 收藏按钮 */}
                    <span
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 40,
                      }}
                      onClick={() => toggleFavorite(item.majorCode)}
                    >
                      {item.isFavorite ? (
                        <StarFilled style={{ color: '#fadb14', fontSize: 20 }} />
                      ) : (
                        <StarOutlined style={{ color: '#ccc', fontSize: 20 }} />
                      )}
                      <span style={{ color: '#ccc', fontSize: 13, marginLeft: 2 }}>收藏</span>
                    </span>
                  </div>
                </div>
              ))
            ) : searchValue.trim() ? (
              // 空搜索结果提示
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: 16,
                }}
              >
                <div style={{ marginBottom: 8 }}>🔍</div>
                <div>未找到匹配的专业</div>
                <div style={{ fontSize: 14, marginTop: 4, marginBottom: 16 }}>
                  请尝试其他关键词或专业代码
                </div>
                <Button
                  type="default"
                  size="small"
                  onClick={handleClearSearch}
                  style={{
                    borderRadius: 16,
                    height: 32,
                    fontSize: 14,
                  }}
                >
                  查看全部专业
                </Button>
              </div>
            ) : (
              // 暂无数据提示
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: 16,
                }}
              >
                <div style={{ marginBottom: 8 }}>📚</div>
                <div>暂无专业数据</div>
                <div style={{ fontSize: 14, marginTop: 4, marginBottom: 16 }}>
                  请先完成专业测评获取数据
                </div>
                <Button
                  type="primary"
                  size="small"
                  onClick={handleRefresh}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: 16,
                    height: 32,
                    fontSize: 14,
                  }}
                >
                  重新加载
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 查看更多按钮（支付相关） */}
      {majors.length <= 5 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <Button
            type="primary"
            shape="round"
            style={{
              width: '90%',
              height: 50,
              fontSize: 22,
              background: '#2563eb',
              border: 'none',
            }}
            onClick={showModal}
          >
            查看更多
          </Button>
        </div>
      )}

      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
      {/* 支付弹窗 */}
      <Modal
        title="解锁完整分析报告"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        className="rounded-2xl"
      >
        <div className="py-6">
          <div className="text-center mb-6">
            <div className="text-2xl font-semibold text-gray-800 mb-2">亲友特惠</div>
            <div className="text-4xl font-bold text-red-500 mb-2">¥0.01</div>
            <div className="text-gray-500 text-sm mb-4">原价 ¥298</div>
            <div className="text-sm text-gray-600 mb-4">解锁全部 845 个本科专业热爱能量值</div>
          </div>
          <Button
            type="primary"
            className="w-full h-12 !rounded-button text-lg font-medium bg-gradient-to-r from-blue-500 to-blue-400 border-none hover:opacity-90"
            onClick={handlePayment}
            loading={payLoading}
            disabled={payLoading}
          >
            {payLoading ? '支付中...' : '立即支付'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MajorPage;
