// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Modal, Tag, message, Tabs, Input } from 'antd';
import * as echarts from 'echarts';
import { DownOutline, LeftOutline } from 'antd-mobile-icons';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getApiUrl,
  getUserMajorScores,
  getMajorDetail,
  createWechatPayOrder,
  callWechatPay,
} from '../../config';
import { SpinLoading } from 'antd-mobile';

const App: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [expanded, setExpanded] = useState([0]);
  const [expandedNoLove, setExpandedNoLove] = useState([0]);
  const [majorLove, setmajorLove] = useState([]);
  const [majoNoLove, setmajorNoLove] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [isPaySuccess, setIsPaySuccess] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreNoLove, setLoadingMoreNoLove] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [majorDetails, setMajorDetail] = useState([]);

  // 虚拟滚动相关状态
  const [visibleCount, setVisibleCount] = useState(10);
  const [visibleCountNoLove, setVisibleCountNoLove] = useState(10);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollTopNoLove, setScrollTopNoLove] = useState(0);
  const containerRef = useRef(null);
  const containerNoLoveRef = useRef(null);
  const baseItemHeight = 120; // 基础高度
  const expandedItemHeight = 300; // 展开后的高度
  const bufferSize = 5; // 缓冲区大小
  const loadMoreThreshold = 50; // 距离底部多少像素时开始加载更多

  // 防抖函数
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 计算可见区域
  const getVisibleRange = useCallback(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / baseItemHeight) - bufferSize);
    const endIndex = Math.min(
      Math.ceil((scrollTop + window.innerHeight) / baseItemHeight) + bufferSize,
      visibleCount
    );
    return { startIndex, endIndex };
  }, [scrollTop, visibleCount]);

  // 计算难爱专业可见区域
  const getVisibleRangeNoLove = useCallback(() => {
    const startIndex = Math.max(0, Math.floor(scrollTopNoLove / baseItemHeight) - bufferSize);
    const endIndex = Math.min(
      Math.ceil((scrollTopNoLove + window.innerHeight) / baseItemHeight) + bufferSize,
      visibleCountNoLove
    );
    return { startIndex, endIndex };
  }, [scrollTopNoLove, visibleCountNoLove]);

  // 处理滚动事件（防抖）
  const handleScroll = useCallback(
    debounce((e) => {
      setScrollTop(e.target.scrollTop);
    }, 16), // 约60fps
    []
  );

  // 处理难爱专业滚动事件（防抖）
  const handleScrollNoLove = useCallback(
    debounce((e) => {
      setScrollTopNoLove(e.target.scrollTop);
    }, 16), // 约60fps
    []
  );

  // 过滤专业数据
  const filterMajors = (majors: any[]) => {
    if (!searchValue.trim()) {
      return majors;
    }
    return majors.filter(
      (major) =>
        major.majorName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        major.majorCode?.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  // 获取过滤后的最爱专业
  const filteredMajorLove = filterMajors(majorLove);
  // 获取过滤后的难爱专业
  const filteredMajorNoLove = filterMajors(majoNoLove);

  // 懒加载更多数据
  const loadMore = useCallback(async () => {
    if (loadingMore || visibleCount >= filteredMajorLove.length) return;
    setLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setVisibleCount((prev) => Math.min(prev + 10, filteredMajorLove.length));
    setLoadingMore(false);
  }, [filteredMajorLove.length, loadingMore, visibleCount]);

  // 懒加载更多难爱专业数据
  const loadMoreNoLove = useCallback(async () => {
    if (loadingMoreNoLove || visibleCountNoLove >= filteredMajorNoLove.length) return;
    setLoadingMoreNoLove(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setVisibleCountNoLove((prev) => Math.min(prev + 10, filteredMajorNoLove.length));
    setLoadingMoreNoLove(false);
  }, [filteredMajorNoLove.length, loadingMoreNoLove, visibleCountNoLove]);

  // 监听滚动到底部
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScrollToBottom = debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - loadMoreThreshold) {
        loadMore();
      }
    }, 100);
    container.addEventListener('scroll', handleScrollToBottom);
    return () => container.removeEventListener('scroll', handleScrollToBottom);
  }, [loadMore, loadMoreThreshold]);

  // 监听难爱专业滚动到底部
  useEffect(() => {
    const container = containerNoLoveRef.current;
    if (!container) return;
    const handleScrollToBottom = debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - loadMoreThreshold) {
        loadMoreNoLove();
      }
    }, 100);
    container.addEventListener('scroll', handleScrollToBottom);
    return () => container.removeEventListener('scroll', handleScrollToBottom);
  }, [loadMoreNoLove, loadMoreThreshold]);

  // 重置虚拟滚动状态
  const resetVirtualScroll = useCallback(() => {
    setVisibleCount(10);
    setVisibleCountNoLove(10);
    setScrollTop(0);
    setScrollTopNoLove(0);
  }, []);

  // 当搜索值改变时重置虚拟滚动
  useEffect(() => {
    resetVirtualScroll();
  }, [searchValue, resetVirtualScroll]);

  const getMajorDetailInfo = async (majorCode) => {
    try {
      if (!majorCode) {
        console.error('未找到专业代码');
        return;
      }

      console.log('正在获取专业详情:', majorCode);
      const detailResponse = await getMajorDetail(majorCode);
      if (detailResponse && detailResponse.code === 200 && detailResponse.data) {
        console.log('获取专业详情成功:', majorCode, detailResponse.data);
        setMajorDetail((prev) => {
          // 检查是否已经存在该专业的详情
          if (prev.some((item) => item.code === majorCode)) {
            console.log('专业详情已存在，跳过添加:', majorCode);
            return prev;
          }
          console.log('添加新的专业详情:', majorCode);
          return [...prev, detailResponse.data];
        });
      } else {
        console.error('获取专业详情失败:', majorCode, detailResponse);
      }
    } catch (error) {
      console.error('获取专业详细信息失败:', error);
    }
  };
  const fetchMajorScores = async () => {
    try {
      const userStr = localStorage.getItem('new-user');
      if (!userStr) {
        setIsAuthModalVisible(true);
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user?.id ?? user?.data?.id;

      const response = await getUserMajorScores(userId);

      if (response && response.code === 200) {
        // 获取所有分数数据
        const scores = (response.data && response.data.scores) || [];

        let topScores = [];
        let bottomScores = [];

        if (scores.length === 6) {
          // 获取前3条最高分数据
          topScores = scores.slice(0, 3);
          setmajorLove(topScores);

          // 获取后3条最低分数据
          bottomScores = scores.slice(-3).reverse();
          setmajorNoLove(bottomScores);
        } else {
          topScores = scores.filter((item) => item.score > 0);
          bottomScores = scores.filter((item) => item.score <= 0).reverse();
          setmajorLove(topScores);

          setmajorNoLove(bottomScores);
        }
        console.log('topScores', topScores, bottomScores);
        if (topScores && topScores.length > 0) {
          getMajorDetailInfo(topScores[0].majorCode);
        }
        // 获取专业详情
        if (bottomScores && bottomScores.length > 0) {
          getMajorDetailInfo(bottomScores[0].majorCode);
        }
      } else {
        message.error(response.message || '获取专业分数失败');
      }
    } catch (error) {
      console.error('获取专业分数失败:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMajorScores();
  }, []);

  // 监听专业详情状态变化
  useEffect(() => {
    console.log('专业详情状态更新:', majorDetails);
  }, [majorDetails]);

  // 监听最爱专业状态变化
  useEffect(() => {
    console.log('最爱专业状态更新:', majorLove);
  }, [majorLove]);

  // 监听难爱专业状态变化
  useEffect(() => {
    console.log('难爱专业状态更新:', majoNoLove);
  }, [majoNoLove]);

  const handleExpand = (index: number) => {
    setExpanded((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleExpandNoLove = (index: number) => {
    setExpandedNoLove((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
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
        setIsAuthModalVisible(true);
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
        setIsPaySuccess(true);
        setIsModalVisible(false);
        // 这里可以添加支付成功后的逻辑，比如刷新数据或跳转页面
      } else {
        message.info('支付已取消');
      }
    } catch (error) {
      console.error('支付失败:', error);
      message.error(error.message || '支付失败，请重试');
    } finally {
      setPayLoading(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleAuthCancel = () => {
    setIsAuthModalVisible(false);
  };

  const handleWechatAuth = () => {
    const authUrl =
      'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe85481f908a50ffc&redirect_uri=http://www.caihongzq.com/analysisReport/&response_type=code&scope=snsapi_userinfo&state=STATE&connect_redirect=1#wechat_redirect';
    window.location.href = authUrl;
  };

  const renderMajorDetail = (majorInf: any, isLove: boolean = false) => {
    const majorDetail = majorDetails.find((item) => item.code === majorInf.majorCode);
    if (majorDetail) {
      let careerDevelopmentTemp = {};
      try {
        const careerDevelopmentT = majorDetail.careerDevelopment?.replace(/'/g, '"');
        if (careerDevelopmentT) {
          careerDevelopmentTemp = JSON.parse(careerDevelopmentT);
        }
      } catch (error) {
        console.error('解析就业方向数据失败:', error);
        careerDevelopmentTemp = {};
      }

      const schools =
        majorDetail.schools && majorDetail.schools.length > 3
          ? majorDetail.schools.slice(0, 3)
          : majorDetail.schools;
      return (
        <div className="space-y-3">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm font-medium text-green-700 mb-1">专业简介</div>
            <p
              className="text-xs text-gray-600 leading-relaxed"
              onClick={() => {
                navigate(
                  `/professColleges?majorCode=${majorInf.majorCode}&&majorName=${majorInf.majorName}&score=${majorInf.score}&isLove=${isLove}`
                );
              }}
            >
              {majorDetail.majorBrief ? (
                <>
                  {majorDetail.majorBrief.length > 50
                    ? `${majorDetail.majorBrief.substring(0, 50)}...`
                    : majorDetail.majorBrief}
                  <span className="text-blue-500 ml-1 cursor-pointer hover:text-blue-600">
                    查看更多
                  </span>
                </>
              ) : (
                '正在收集...'
              )}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-700 mb-1">就业方向</div>
            <p
              className="text-xs text-gray-600"
              onClick={() => {
                navigate(
                  `/professColleges?majorCode=${majorInf.majorCode}&&majorName=${majorInf.majorName}&score=${majorInf.score}&isLove=${isLove}`
                );
              }}
            >
              {careerDevelopmentTemp['主要就业方向'] ? (
                <>
                  {careerDevelopmentTemp['主要就业方向'].length > 50
                    ? `${careerDevelopmentTemp['主要就业方向'].substring(0, 50)}...`
                    : careerDevelopmentTemp['主要就业方向']}
                  <span className="text-blue-500 ml-1 cursor-pointer hover:text-blue-600">
                    查看更多
                  </span>
                </>
              ) : (
                '正在收集...'
              )}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm font-medium text-purple-700 mb-1">招生院校</div>
            <p
              className="text-xs text-gray-600"
              onClick={() => {
                navigate(
                  `/professColleges?majorCode=${majorInf.majorCode}&&majorName=${majorInf.majorName}&score=${majorInf.score}&isLove=${isLove}&type=${'schools'}`
                );
              }}
            >
              {schools && schools.length > 0
                ? schools.map((i, index) => (
                    <React.Fragment key={index}>
                      <Tag color="green" className="mb-1">
                        {i.name}
                      </Tag>
                      {index === schools.length - 1 ? (
                        <span className="text-blue-500 ml-1 cursor-pointer hover:text-blue-600">
                          查看更多
                        </span>
                      ) : (
                        ''
                      )}
                    </React.Fragment>
                  ))
                : '正在收集...'}
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm font-medium text-green-700 mb-1">专业简介</div>
            <p className="text-xs text-gray-600 leading-relaxed">正在收集...</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-700 mb-1">就业前景</div>
            <p className="text-xs text-gray-600">正在收集...</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm font-medium text-purple-700 mb-1">招生院校</div>
            <p className="text-xs text-gray-600">正在收集...</p>
          </div>
        </div>
      );
    }
  };

  // 检查是否有上一页
  const hasPreviousPage = () => {
    return window.history.length > 1;
  };

  // 搜索功能
  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  // 计算实际item高度
  const getItemHeight = useCallback((index, isExpanded) => {
    return isExpanded ? expandedItemHeight : baseItemHeight;
  }, []);

  // 计算总高度
  const getTotalHeight = useCallback(
    (items, expandedItems) => {
      return items.reduce((total, _, index) => {
        return total + getItemHeight(index, expandedItems.includes(index));
      }, 0);
    },
    [getItemHeight]
  );

  return (
    <div className="relative min-h-screen bg-[#FFFDF7] pb-16">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-white shadow-sm z-50 flex items-center">
        {hasPreviousPage() && (
          <div className="absolute left-4">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="mr-2"
            />
          </div>
        )}
        <h1 className="text-lg font-medium flex-1 text-center">各专业分析报告</h1>
      </div>
      {/* 主要内容区域 */}
      <div className="pt-16 px-4">
        {/* 温馨提示 */}
        <div className="rounded-lg p-4 mb-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
          <p className="text-gray-600 text-sm leading-relaxed">
            温馨提示：以下分析，均基于您对自身喜欢与天赋自评，受自我认知深入程度影响，请结合实际情况综合考量。
          </p>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <Input
            placeholder="搜索专业名称或编号..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="rounded-lg"
            size="large"
            allowClear
          />
        </div>

        {/* 专业分析页签 */}
        <div className="mb-8">
          <Tabs
            defaultActiveKey="love"
            type="card"
            size="large"
            items={[
              {
                key: 'love',
                label: (
                  <div className="flex items-center">
                    <span className="text-green-500 text-lg font-medium">"最爱"</span>
                    <span className="text-gray-700 text-lg ml-1">专业</span>
                    {searchValue && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({filteredMajorLove.length}/{majorLove.length})
                      </span>
                    )}
                  </div>
                ),
                children: (
                  <div
                    ref={containerRef}
                    className="space-y-4 max-h-[600px] overflow-y-auto"
                    onScroll={handleScroll}
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <SpinLoading color="primary" />
                      </div>
                    ) : filteredMajorLove.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchValue ? '未找到匹配的专业' : '暂无数据'}
                      </div>
                    ) : (
                      <>
                        {/* 虚拟滚动的占位符 */}
                        <div>
                          {filteredMajorLove.slice(0, visibleCount).map((item, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 mb-4"
                            >
                              <div className="flex flex-col">
                                <div
                                  className="flex justify-between items-center mb-3 cursor-pointer"
                                  onClick={() => {
                                    getMajorDetailInfo(item.majorCode);
                                    handleExpand(index);
                                  }}
                                >
                                  <div
                                    className="flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/professColleges?majorCode=${item.majorCode}&&majorName=${item.majorName}&score=${item.score}&isLove=true`
                                      );
                                    }}
                                  >
                                    <span className="text-gray-500">{item.majorCode}</span>
                                    <span className="ml-1 text-gray-800 cursor-pointer hover:text-gray-600 underline">
                                      {item.majorName}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <div
                                      className="text-green-500 font-medium mr-5 cursor-pointer hover:text-green-600 underline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/loveEnergy?majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&isLove=true`
                                        );
                                      }}
                                    >
                                      热爱能量 {Math.ceil(item.score * 100)} 分！
                                    </div>
                                    <DownOutline
                                      className={`transition-transform ${expanded.includes(index) ? 'rotate-180' : ''}`}
                                      style={{ fontSize: 18 }}
                                    />
                                  </div>
                                </div>
                                {expanded.includes(index) && (
                                  <div className="mt-3">{renderMajorDetail(item, true)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 加载更多提示 */}
                        {visibleCount < filteredMajorLove.length && (
                          <div className="text-center py-4">
                            <div className="text-gray-500 text-sm">
                              已显示 {visibleCount} / {filteredMajorLove.length} 条数据
                            </div>
                            <button
                              onClick={loadMore}
                              disabled={loadingMore}
                              className="mt-2 text-blue-500 text-sm hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                            >
                              {loadingMore ? (
                                <>
                                  <SpinLoading
                                    color="primary"
                                    style={{ fontSize: 14, marginRight: 8 }}
                                  />
                                  加载中...
                                </>
                              ) : (
                                '加载更多'
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    {!isPaySuccess && majorLove <= 3 && majoNoLove.length <= 3 && (
                      <div className="mt-4 relative">
                        <button
                          onClick={showModal}
                          className="text-blue-500 text-sm flex items-center group hover:text-blue-600 transition-colors"
                        >
                          查看更多
                          <i className="fas fa-arrow-right ml-1 transform transition-transform group-hover:translate-x-1"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'noLove',
                label: (
                  <div className="flex items-center">
                    <span className="text-red-500 text-lg font-medium">"难爱"</span>
                    <span className="text-gray-700 text-lg ml-1">专业</span>
                    {searchValue && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({filteredMajorNoLove.length}/{majoNoLove.length})
                      </span>
                    )}
                  </div>
                ),
                children: (
                  <div
                    ref={containerNoLoveRef}
                    className="space-y-4 max-h-[600px] overflow-y-auto"
                    onScroll={handleScrollNoLove}
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <SpinLoading color="primary" />
                      </div>
                    ) : filteredMajorNoLove.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchValue ? '未找到匹配的专业' : '暂无数据'}
                      </div>
                    ) : (
                      <>
                        {/* 虚拟滚动的占位符 */}
                        <div>
                          {filteredMajorNoLove.slice(0, visibleCountNoLove).map((item, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 mb-4"
                            >
                              <div className="flex flex-col">
                                <div
                                  className="flex justify-between items-center mb-3 cursor-pointer"
                                  onClick={() => {
                                    getMajorDetailInfo(item.majorCode);
                                    handleExpandNoLove(index);
                                  }}
                                >
                                  <div
                                    className="flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/professColleges?majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&isLove=false`
                                      );
                                    }}
                                  >
                                    <span className="text-gray-500">{item.majorCode}</span>
                                    <span className="ml-1 text-gray-800 cursor-pointer hover:text-gray-600 underline">
                                      {item.majorName}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <div
                                      className="text-red-500 font-medium mr-5 cursor-pointer hover:text-green-600 underline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/loveEnergy?majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&isLove=false`
                                        );
                                      }}
                                    >
                                      热爱能量 {Math.ceil(item.score * 100)} 分！
                                    </div>
                                    <DownOutline
                                      className={`transition-transform ${expandedNoLove.includes(index) ? 'rotate-180' : ''}`}
                                      style={{ fontSize: 18 }}
                                    />
                                  </div>
                                </div>
                                {expandedNoLove.includes(index) && (
                                  <div className="mt-3">{renderMajorDetail(item)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 加载更多提示 */}
                        {visibleCountNoLove < filteredMajorNoLove.length && (
                          <div className="text-center py-4">
                            <div className="text-gray-500 text-sm">
                              已显示 {visibleCountNoLove} / {filteredMajorNoLove.length} 条数据
                            </div>
                            <button
                              onClick={loadMoreNoLove}
                              disabled={loadingMoreNoLove}
                              className="mt-2 text-blue-500 text-sm hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                            >
                              {loadingMoreNoLove ? (
                                <>
                                  <SpinLoading
                                    color="primary"
                                    style={{ fontSize: 14, marginRight: 8 }}
                                  />
                                  加载中...
                                </>
                              ) : (
                                '加载更多'
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    {!isPaySuccess && majorLove <= 3 && majoNoLove.length <= 3 && (
                      <button
                        onClick={showModal}
                        className="text-blue-500 text-sm mt-4 flex items-center group hover:text-blue-600 transition-colors"
                      >
                        查看更多
                        <i className="fas fa-arrow-right ml-1 transform transition-transform group-hover:translate-x-1"></i>
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>

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
              className="w-full h-12 !rounded-button text-lg font-medium bg-gradient-to-r from-green-500 to-green-400 border-none hover:opacity-90"
              onClick={handlePayment}
              loading={payLoading}
              disabled={payLoading}
            >
              {payLoading ? '支付中...' : '立即支付'}
            </Button>
          </div>
        </Modal>

        {/* 微信授权弹窗 */}
        <Modal
          title="微信授权登录"
          open={isAuthModalVisible}
          onCancel={handleAuthCancel}
          footer={null}
          className="rounded-2xl"
          closable={false}
        >
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="text-2xl font-semibold text-gray-800 mb-2">需要授权登录</div>
              <div className="text-gray-500 text-sm mb-4">请使用微信授权登录以查看专业分析报告</div>
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">
                  授权后将获得您的微信头像、昵称等基本信息，用于个性化推荐服务
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                type="primary"
                className="w-full h-12 !rounded-button text-lg font-medium bg-gradient-to-r from-green-500 to-green-400 border-none hover:opacity-90"
                onClick={handleWechatAuth}
              >
                微信授权登录
              </Button>
              <Button
                className="w-full h-10 !rounded-button text-gray-600 border-gray-300 hover:border-gray-400"
                onClick={handleAuthCancel}
              >
                稍后再说
              </Button>
            </div>
          </div>
        </Modal>

        {/* 底部说明文字 */}
        <div className="mt-8 text-sm text-gray-500 leading-relaxed">
          <p>
            每个专业名称后的"热爱能量"，均可点击进入，查看该专业"乐学/善学特质"，了解专业特质匹配原因。
          </p>
          <p>并可点击进入自评内容，查看选项与得分。</p>
          <p>详细了解，为什么这个专业我有这样的"热爱能量"！</p>
        </div>
      </div>
    </div>
  );
};
export default App;
