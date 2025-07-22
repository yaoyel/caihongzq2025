// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { Input, Button, Modal, message, Spin, Tabs, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import BottomNav from '../comm/bottom';
import { getUserMajorScores, callWechatPay } from '../../config';
import {
  toggleMajorIntention,
  cancelMajorIntention,
  getMajorIntentions,
} from '../../config/volunteer';
import './list.css'; // 可根据需要自定义样式

/**
 * 自定义 Hook：管理滚动位置（使用 sessionStorage 持久化）
 */
const useScrollPosition = (ref: React.RefObject<HTMLDivElement>) => {
  const STORAGE_KEY = 'major-list-scroll-position';
  const CLICKED_MAJOR_CODE_KEY = 'major-list-clicked-major-code';

  // 保存滚动位置到 sessionStorage
  const saveScrollPosition = useCallback(() => {
    if (ref.current) {
      const scrollTop = ref.current.scrollTop;
      sessionStorage.setItem(STORAGE_KEY, scrollTop.toString());
    }
  }, [ref]);

  // 保存点击的专业代码
  const saveClickedMajorCode = useCallback((majorCode: string) => {
    sessionStorage.setItem(CLICKED_MAJOR_CODE_KEY, majorCode);
  }, []);

  // 从 sessionStorage 恢复滚动位置，通过定位到点击的专业来避免分割线影响
  const restoreScrollPosition = useCallback(
    (majors: any[]) => {
      const clickedMajorCode = sessionStorage.getItem(CLICKED_MAJOR_CODE_KEY);

      if (ref.current && clickedMajorCode && majors.length > 0) {
        // 使用 requestAnimationFrame 确保 DOM 已渲染
        requestAnimationFrame(() => {
          if (ref.current) {
            // 查找点击的专业在DOM中的位置
            const majorElements = ref.current.querySelectorAll('[data-major-code]');
            let targetElement: Element | null = null;

            majorElements.forEach((element) => {
              if (element.getAttribute('data-major-code') === clickedMajorCode) {
                targetElement = element;
              }
            });

            if (targetElement) {
              // 滚动到点击的专业位置
              targetElement.scrollIntoView({
                behavior: 'auto',
                block: 'center',
              });
            } else {
              // 如果找不到元素，使用保存的滚动位置作为备选
              const savedPosition = sessionStorage.getItem(STORAGE_KEY);
              if (savedPosition) {
                const scrollTop = parseInt(savedPosition, 10);
                ref.current.scrollTop = scrollTop;
              }
            }
          }
        });
      }
    },
    [ref]
  );

  // 清除保存的滚动位置
  const clearScrollPosition = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(CLICKED_MAJOR_CODE_KEY);
  }, []);

  return { saveScrollPosition, saveClickedMajorCode, restoreScrollPosition, clearScrollPosition };
};

/**
 * 自定义 Hook：管理点击状态
 */
const useClickState = () => {
  const [clickedMajorCode, setClickedMajorCode] = useState<string | null>(null);
  const CLICK_STORAGE_KEY = 'major-list-clicked-code';
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清除定时器的函数
  const clearClickTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 初始化时从 sessionStorage 恢复点击状态
  useEffect(() => {
    const savedClickedCode = sessionStorage.getItem(CLICK_STORAGE_KEY);
    const isFromDetail = sessionStorage.getItem('major-list-scroll-position') !== null;

    if (savedClickedCode && isFromDetail) {
      setClickedMajorCode(savedClickedCode);
      // 只有在从详情页返回时才开始8秒倒计时
      timeoutRef.current = setTimeout(() => {
        setClickedMajorCode(null);
        sessionStorage.removeItem(CLICK_STORAGE_KEY);
      }, 8000);
    }

    // 组件卸载时清除定时器
    return () => {
      clearClickTimeout();
    };
  }, [clearClickTimeout]);

  const handleMajorClick = useCallback(
    (majorCode: string) => {
      // 清除之前的定时器
      clearClickTimeout();

      setClickedMajorCode(majorCode);
      // 保存到 sessionStorage
      sessionStorage.setItem(CLICK_STORAGE_KEY, majorCode);

      // 注意：不在这里设置定时器，让点击状态保持到用户返回
      // 只有在用户返回后才开始5秒倒计时
    },
    [clearClickTimeout]
  );

  return { clickedMajorCode, handleMajorClick };
};

/**
 * 最爱专业页面组件
 */
const MajorPage: React.FC = () => {
  const navigator = useNavigate();

  // 原始专业列表数据
  const [originalMajors, setOriginalMajors] = useState<any[]>([]);
  // 当前显示的专业列表数据（经过搜索过滤和排序）
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
  // 收藏专业列表
  const [majorIntentions, setMajorIntentions] = useState<any[]>([]);
  // 标记是否已经初始化过数据
  const [isInitialized, setIsInitialized] = useState(false);
  // 提示弹窗状态
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  // 用户选择状态
  const [userChoices, setUserChoices] = useState({
    choice1: false,
    choice2: false,
  });
  // 选项卡状态 - 控制最爱专业显示方式
  const [activeTab, setActiveTab] = useState<'development' | 'passion' | 'opportunity'>(
    'development'
  );
  // 子选项卡状态 - 控制学习特质显示方式
  const [activeSubTab, setActiveSubTab] = useState<'le' | 'shan' | 'yan' | 'zu'>();
  // 机遇指数子选项卡状态 - 控制机遇指数显示方式
  const [activeOpportunitySubTab, setActiveOpportunitySubTab] = useState<
    'academic' | 'career' | 'industry' | 'growth'
  >();

  // 计算当前实际要渲染的专业数据
  const displayMajors = majors.slice(0, currentPage * pageSize);

  // 在组件内添加ref
  const listAreaRef = useRef<HTMLDivElement>(null);

  /**
   * 计算推荐标记数组，基于isMatching字段判断是否可报考
   * @param majorsList 专业列表
   * @returns 推荐标记数组
   */
  const getRecommendFlags = (majorsList: any[]) => {
    const flags: boolean[] = new Array(majorsList.length).fill(false);
    for (let i = 0; i < majorsList.length; i++) {
      // 如果isMatching为true，则标记为可报考
      flags[i] = Boolean(majorsList[i].isMatching);
    }
    return flags;
  };

  // 推荐标记数组
  const recommendFlags = getRecommendFlags(majors);

  // 找到第一个不可报考的索引（isMatching为false的第一个位置）
  const firstNonMatchingIndex = recommendFlags.findIndex((flag) => !flag);

  // 使用自定义 Hook
  const { saveScrollPosition, saveClickedMajorCode, restoreScrollPosition, clearScrollPosition } =
    useScrollPosition(listAreaRef);
  const { clickedMajorCode, handleMajorClick } = useClickState();

  // 使用 useMemo 优化收藏状态匹配，避免重复计算
  const favoriteMajorCodes = useMemo(() => {
    return new Set(majorIntentions.map((item: any) => String(item.majorCode)));
  }, [majorIntentions]);

  /**
   * 根据当前选项卡和子选项卡获取排序字段
   * @returns 排序字段名
   */
  const getSortField = useCallback(() => {
    // 如果选择了热爱能量的子选项卡
    if (activeTab === 'passion' && activeSubTab) {
      switch (activeSubTab) {
        case 'le':
          return 'lexueScore';
        case 'shan':
          return 'shanxueScore';
        case 'yan':
          return 'yanxueDeduction';
        case 'zu':
          return 'tiaozhanDeduction';
        default:
          return 'score';
      }
    }

    // 如果选择了机遇指数的子选项卡
    if (activeTab === 'opportunity' && activeOpportunitySubTab) {
      switch (activeOpportunitySubTab) {
        case 'academic':
          return 'academicDevelopmentScore';
        case 'career':
          return 'careerDevelopmentScore';
        case 'industry':
          return 'industryProspectsScore';
        case 'growth':
          return 'growthPotentialScore';
        default:
          return 'opportunityScore';
      }
    }

    // 主选项卡排序
    switch (activeTab) {
      case 'development':
        return 'developmentPotential';
      case 'passion':
        return 'score';
      case 'opportunity':
        return 'opportunityScore';
      default:
        return 'developmentPotential';
    }
  }, [activeTab, activeSubTab, activeOpportunitySubTab]);

  /**
   * 对专业列表进行排序
   * @param data 要排序的数据
   * @returns 排序后的数据
   */
  const sortMajors = useCallback(
    (data: any[]) => {
      const sortField = getSortField();
      return [...data].sort((a, b) => {
        // 首先按照isMatching分组：可报考的在前，不可报考的在后
        const aMatching = Boolean(a.isMatching);
        const bMatching = Boolean(b.isMatching);

        if (aMatching !== bMatching) {
          return aMatching ? -1 : 1; // 可报考的排在前面
        }

        // 在相同分组内，按照分数倒序排序
        const aValue = Number(a[sortField] || 0);
        const bValue = Number(b[sortField] || 0);
        return bValue - aValue;
      });
    },
    [getSortField]
  );

  // 当选项卡或子选项卡切换时，重新排序数据
  useEffect(() => {
    if (originalMajors.length > 0) {
      const sortedData = sortMajors(originalMajors);
      setMajors(sortedData);
    }
  }, [activeTab, activeSubTab, activeOpportunitySubTab, originalMajors, sortMajors]);

  /**
   * 检查专业是否已收藏
   * @param majorCode 专业代码
   * @returns 是否已收藏
   */
  const isMajorFavorite = useCallback(
    (majorCode: number | string): boolean => {
      return favoriteMajorCodes.has(String(majorCode));
    },
    [favoriteMajorCodes]
  );

  /**
   * 获取专业分数数据
   */
  const fetchMajorScores = useCallback(
    async (isLoadMore = false) => {
      // 检查是否有缓存的数据
      const cachedData = sessionStorage.getItem('major-list-cached-data');
      const isFromDetail = sessionStorage.getItem('major-list-scroll-position') !== null;

      // 如果是从详情页返回且有缓存数据，直接使用缓存
      if (isFromDetail && cachedData && !isLoadMore) {
        try {
          const parsedData = JSON.parse(cachedData);
          setOriginalMajors(parsedData);
          const sortedData = sortMajors(parsedData);
          setMajors(sortedData);
          setLoading(false);

          // 在数据设置完成后立即恢复滚动位置
          setTimeout(() => {
            restoreScrollPosition(sortedData);
          }, 500);

          // 再次尝试，确保分割线完全渲染
          setTimeout(() => {
            restoreScrollPosition(sortedData);
          }, 1000);

          return;
        } catch (error) {
          console.error('解析缓存数据失败:', error);
          // 如果解析失败，继续正常加载
        }
      }

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
            const newOriginalMajors = [...originalMajors, ...scores];
            setOriginalMajors(newOriginalMajors);
            const sortedData = sortMajors(newOriginalMajors);
            setMajors(sortedData);
          } else {
            // 首次加载：替换数据并排序
            setOriginalMajors(scores);
            const sortedData = sortMajors(scores);
            setMajors(sortedData);
            // 缓存数据到 sessionStorage
            sessionStorage.setItem('major-list-cached-data', JSON.stringify(scores));
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
    },
    [pageSize, restoreScrollPosition]
  );

  /**
   * 获取收藏专业列表
   */
  const fetchMajorIntentions = useCallback(async (forceRefresh = false) => {
    // 检查是否有缓存的收藏数据
    const cachedIntentions = sessionStorage.getItem('major-list-cached-intentions');
    const isFromDetail = sessionStorage.getItem('major-list-scroll-position') !== null;

    // 如果是从详情页返回且有缓存数据，且不是强制刷新，则直接使用缓存
    if (isFromDetail && cachedIntentions && !forceRefresh) {
      try {
        const parsedIntentions = JSON.parse(cachedIntentions);
        setMajorIntentions(parsedIntentions);
        return;
      } catch (error) {
        console.error('解析缓存收藏数据失败:', error);
        // 如果解析失败，继续正常加载
      }
    }

    try {
      const response = await getMajorIntentions();
      if (response && response.code === 200) {
        const intentions = response.data || [];
        setMajorIntentions(intentions);
        // 缓存收藏数据到 sessionStorage
        sessionStorage.setItem('major-list-cached-intentions', JSON.stringify(intentions));
        console.log('收藏专业列表', intentions);
      }
    } catch (error) {
      console.error('获取收藏专业列表失败:', error);
    }
  }, []);

  // 初始化数据加载 - 只在首次挂载时加载
  useEffect(() => {
    if (!isInitialized) {
      fetchMajorScores();
      fetchMajorIntentions();
      setIsInitialized(true);
    }
  }, [fetchMajorScores, fetchMajorIntentions, isInitialized]);

  // 检查是否需要显示提示弹窗
  useEffect(() => {
    if (isInitialized && !loading && majors.length > 0) {
      // 检查是否设置了永远不显示
      const neverShow = localStorage.getItem('major-list-tip-never-show');
      if (neverShow === 'true') {
        return;
      }

      // 检查今天是否已经显示过
      const today = new Date().toDateString();
      const lastShownDate = localStorage.getItem('major-list-tip-last-shown');
      if (lastShownDate === today) {
        return;
      }

      // 显示弹窗
      const timer = setTimeout(() => {
        setIsTipModalVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, loading, majors.length]);

  // 使用 useLayoutEffect 确保在 DOM 更新后立即恢复滚动位置
  useLayoutEffect(() => {
    const isFromDetail = sessionStorage.getItem('major-list-scroll-position') !== null;

    if (isFromDetail && isInitialized && majors.length > 0 && !loading) {
      // 确保滚动容器存在且有内容
      if (listAreaRef.current && listAreaRef.current.scrollHeight > 0) {
        // 增加延迟，确保分割线等动态内容完全渲染
        setTimeout(() => {
          restoreScrollPosition(majors);
        }, 500);
      }
    }
  }, [majors.length, isInitialized, loading, restoreScrollPosition]);

  // 额外的滚动位置恢复检查 - 确保在数据渲染完成后恢复
  useEffect(() => {
    const isFromDetail = sessionStorage.getItem('major-list-scroll-position') !== null;

    if (isFromDetail && isInitialized && majors.length > 0 && !loading) {
      // 延迟恢复滚动位置，确保所有内容都已渲染
      const timer = setTimeout(() => {
        if (listAreaRef.current && listAreaRef.current.scrollHeight > 0) {
          restoreScrollPosition(majors);
        }
      }, 500);

      // 再次尝试，确保分割线完全渲染
      const timer2 = setTimeout(() => {
        if (listAreaRef.current && listAreaRef.current.scrollHeight > 0) {
          restoreScrollPosition(majors);
        }
      }, 1000);

      // 第三次尝试，确保所有内容完全稳定
      const timer3 = setTimeout(() => {
        if (listAreaRef.current && listAreaRef.current.scrollHeight > 0) {
          restoreScrollPosition(majors);
        }
      }, 1500);

      // 第四次尝试，确保完全渲染
      const timer4 = setTimeout(() => {
        if (listAreaRef.current && listAreaRef.current.scrollHeight > 0) {
          restoreScrollPosition(majors);
        }
      }, 2000);

      // 使用 MutationObserver 监听DOM变化，确保分割线渲染完成
      const observer = new MutationObserver((mutations) => {
        // 检查是否有分割线相关的DOM变化
        const hasDividerChanges = mutations.some(
          (mutation) =>
            mutation.type === 'childList' &&
            mutation.addedNodes.length > 0 &&
            Array.from(mutation.addedNodes).some(
              (node) =>
                node.nodeType === Node.ELEMENT_NODE &&
                (node as Element).textContent?.includes('暂时不可报考')
            )
        );

        if (hasDividerChanges) {
          // 分割线已渲染，再次恢复滚动位置
          setTimeout(() => {
            if (listAreaRef.current && listAreaRef.current.scrollHeight > 0) {
              restoreScrollPosition(majors);
            }
          }, 200);
        }
      });

      // 开始监听DOM变化
      if (listAreaRef.current) {
        observer.observe(listAreaRef.current, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        observer.disconnect();
      };
    }
  }, [majors.length, isInitialized, loading, restoreScrollPosition]);

  // 监听页面可见性变化，当页面重新变为可见时恢复滚动位置
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const isFromDetail = sessionStorage.getItem('major-list-scroll-position') !== null;
        if (isFromDetail && isInitialized && majors.length > 0) {
          // 增加延迟，确保分割线等动态内容完全渲染
          setTimeout(() => {
            if (listAreaRef.current && listAreaRef.current.scrollHeight > 0) {
              restoreScrollPosition(majors);
            }
          }, 500);

          // 再次尝试，确保完全渲染
          setTimeout(() => {
            if (listAreaRef.current && listAreaRef.current.scrollHeight > 0) {
              restoreScrollPosition(majors);
            }
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [restoreScrollPosition, isInitialized, majors.length]);

  // 组件卸载时不清除滚动位置，让它在页面刷新时自动清除
  useEffect(() => {
    return () => {
      // 不清除滚动位置，保持到页面刷新
    };
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
  const filterMajors = useCallback((searchText: string, data: any[]) => {
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
  }, []);

  /**
   * 处理搜索输入变化
   */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      // 重置分页状态
      setCurrentPage(1);
      setHasMore(true);

      // 实时搜索：根据输入内容过滤数据并排序
      const filteredData = filterMajors(value, originalMajors);
      const sortedData = sortMajors(filteredData);
      setMajors(sortedData);
    },
    [filterMajors, originalMajors, sortMajors]
  );

  const showModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // 获取用户openid
  const getUserOpenid = useCallback(() => {
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
  }, []);

  // 处理支付
  const handlePayment = useCallback(async () => {
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
      const amount = 100;

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
  }, [getUserOpenid, fetchMajorScores]);

  /**
   * 清空搜索
   */
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setCurrentPage(1);
    setHasMore(true);
    const sortedData = sortMajors(originalMajors); // 恢复显示所有专业并排序
    setMajors(sortedData);
  }, [originalMajors, sortMajors]);

  /**
   * 切换收藏状态
   */
  const toggleFavorite = useCallback(
    async (majorCode: number) => {
      try {
        const isCurrentlyFavorite = isMajorFavorite(majorCode);

        let response;
        if (isCurrentlyFavorite) {
          // 当前已收藏，执行取消收藏
          response = await cancelMajorIntention(String(majorCode));
          if (response && response.code === 200) {
            message.success('取消收藏成功');
            // 重新获取收藏列表以更新状态
            await fetchMajorIntentions(true);
          }
        } else {
          // 当前未收藏，执行收藏
          response = await toggleMajorIntention(String(majorCode));
          if (response && response.code === 200) {
            message.success('收藏成功');
            // 重新获取收藏列表以更新状态
            await fetchMajorIntentions(true);
          }
        }
      } catch (error) {
        console.error('切换收藏状态失败:', error);
        message.error('操作失败，请重试');
      }
    },
    [isMajorFavorite, fetchMajorIntentions]
  );

  /**
   * 搜索按钮点击事件处理
   */
  const handleSearch = useCallback(() => {
    // 搜索按钮点击时，重新执行搜索（虽然已经实时搜索了，这里可以添加额外逻辑）
    const filteredData = filterMajors(searchValue, originalMajors);
    const sortedData = sortMajors(filteredData);
    setMajors(sortedData);

    // 可以在这里添加搜索提示
    if (searchValue.trim() && filteredData.length === 0) {
      message.info('未找到匹配的专业');
    }
  }, [filterMajors, searchValue, originalMajors, sortMajors]);

  /**
   * 处理专业点击事件
   */
  const handleMajorItemClick = useCallback(
    (item: any, isFavorite: boolean) => {
      // 保存当前滚动位置
      saveScrollPosition();

      // 保存点击的专业代码
      saveClickedMajorCode(String(item.majorCode));

      // 设置点击状态
      handleMajorClick(String(item.majorCode));

      // 使用 replace 方法导航到详情页，这样返回时不会重新加载页面
      // 但是保持导航历史，这样用户可以使用浏览器的后退按钮
      navigator(
        `/major/majorlovedetail?majorCode=${item.majorCode}&&majorName=${item.majorName}&score=${item.score}&isFavorite=${isFavorite}`,
        { replace: false } // 不使用 replace，保持正常的导航历史，但通过 isInitialized 避免重新加载
      );
    },
    [saveScrollPosition, saveClickedMajorCode, handleMajorClick, navigator]
  );

  /**
   * 重新加载数据
   */
  const handleRefresh = useCallback(() => {
    // 只在主动刷新时清除滚动位置和缓存数据
    clearScrollPosition();
    sessionStorage.removeItem('major-list-cached-data');
    sessionStorage.removeItem('major-list-cached-intentions');
    sessionStorage.removeItem('major-list-clicked-code'); // 清除点击状态
    fetchMajorScores();
    fetchMajorIntentions(true); // 强制刷新收藏数据
  }, [fetchMajorScores, fetchMajorIntentions, clearScrollPosition]);

  /**
   * 截断专业名称，超过6个字符时用省略号表示
   * @param name 专业名称
   * @returns 截断后的专业名称
   */
  const truncateMajorName = useCallback((name: string) => {
    if (!name) return '';
    return name.length > 5 ? name.substring(0, 5) + '...' : name;
  }, []);

  /**
   * 根据当前选项卡和子选项卡获取分数显示文本
   * @param item 专业数据项
   * @returns 显示文本
   */
  const getScoreDisplayText = useCallback(
    (item: any) => {
      // 如果选择了热爱能量的子选项卡
      if (activeTab === 'passion' && activeSubTab) {
        switch (activeSubTab) {
          case 'le':
            return `乐学${Math.ceil((item.lexueScore ?? 0) * 100)}分！`;
          case 'shan':
            return `善学${Math.ceil((item.shanxueScore ?? 0) * 100)}分！`;
          case 'yan':
            return `厌学${Math.ceil((item.yanxueDeduction ?? 0) * 100)}分！`;
          case 'zu':
            return `阻学${Math.ceil((item.tiaozhanDeduction ?? 0) * 100)}分！`;
          default:
            return `热爱能量${Math.ceil((item.score ?? 0) * 100)}分！`;
        }
      }

      // 如果选择了机遇指数的子选项卡
      if (activeTab === 'opportunity' && activeOpportunitySubTab) {
        switch (activeOpportunitySubTab) {
          case 'academic':
            return `学业发展${Math.ceil(item.academicDevelopmentScore ?? 0)}分！`;
          case 'career':
            return `职业回报${Math.ceil(item.careerDevelopmentScore ?? 0)}分！`;
          case 'industry':
            return `产业前景${Math.ceil(item.industryProspectsScore ?? 0)}分！`;
          case 'growth':
            return `成长空间${Math.ceil(item.growthPotentialScore ?? 0)}分！`;
          default:
            return `机遇指数${Math.ceil(item.opportunityScore ?? 0)}分！`;
        }
      }

      // 主选项卡显示
      switch (activeTab) {
        case 'development':
          return `发展潜能${Math.ceil(item.developmentPotential ?? 0)}分！`;
        case 'passion':
          return `热爱能量${Math.ceil(item.score ?? 0)}分！`;
        case 'opportunity':
          return `机遇指数${Math.ceil(item.opportunityScore ?? 0)}分！`;
        default:
          return `发展潜能${Math.ceil(item.developmentPotential ?? 0)}分！`;
      }
    },
    [activeTab, activeSubTab, activeOpportunitySubTab]
  );

  /**
   * 处理用户选择变化
   */
  const handleChoiceChange = useCallback((choice: 'choice1' | 'choice2', checked: boolean) => {
    setUserChoices((prev) => ({
      ...prev,
      [choice]: checked,
    }));
  }, []);

  /**
   * 处理提示弹窗确认
   */
  const handleTipModalConfirm = useCallback(() => {
    // 根据用户选择设置不同的存储策略
    if (userChoices.choice1) {
      // 今天不显示
      const today = new Date().toDateString();
      localStorage.setItem('major-list-tip-last-shown', today);
    }

    if (userChoices.choice2) {
      // 以后都不显示
      localStorage.setItem('major-list-tip-never-show', 'true');
    }

    setIsTipModalVisible(false);
  }, [userChoices]);

  /**
   * 处理提示弹窗关闭
   */
  const handleTipModalClose = useCallback(() => {
    setIsTipModalVisible(false);
  }, []);

  /**
   * 计算分数
   * @param score 分数
   * @returns 计算后的分数
   */
  const getCalcScore = useCallback((score: number) => {
    return Math.ceil(score);
  }, []);

  /**
   * 计算分数
   * @param score 分数
   * @returns 计算后的分数
   */
  const getCalcScore100 = useCallback((score: number) => {
    return Math.ceil(score * 100);
  }, []);

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

      {/* 为固定选项卡区域留出空间 */}
      <div
        style={{ height: activeTab === 'passion' || activeTab === 'opportunity' ? '95px' : '55px' }}
      ></div>
      {/* 选项卡区域 */}
      <div
        style={{
          position: 'fixed',
          top: '68px',
          left: 0,
          right: 0,
          zIndex: 999,
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '12px 16px 8px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: '#f5f5f5',
            borderRadius: '20px',
            padding: '4px',
            gap: '4px',
          }}
        >
          {[
            { key: 'development', label: '发展潜能', icon: '▲', color: '#2563eb' },
            { key: 'passion', label: '热爱能量', icon: '♥', color: '#dc2626' },
            { key: 'opportunity', label: '机遇指数', icon: '★', color: '#059669' },
          ].map((tab) => (
            <div
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                // 切换主选项卡时重置子选项卡状态
                setActiveSubTab(undefined);
                setActiveOpportunitySubTab(undefined);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: activeTab === tab.key ? tab.color : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#666',
                boxShadow: activeTab === tab.key ? `0 2px 8px ${tab.color}40` : 'none',
                transform: activeTab === tab.key ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span style={{ marginRight: '4px', fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </div>
          ))}
        </div>

        {/* 热爱能量子选项卡 */}
        {activeTab === 'passion' && (
          <div
            style={{
              display: 'flex',
              background: '#fef2f2',
              borderRadius: '16px',
              padding: '4px',
              gap: '4px',
              marginTop: '8px',
            }}
          >
            {[
              { key: 'le', label: '乐学', color: '#52c41a' },
              { key: 'shan', label: '善学', color: '#1890ff' },
              { key: 'yan', label: '厌学', color: '#fa8c16' },
              { key: 'zu', label: '阻学', color: '#f5222d' },
            ].map((subTab) => (
              <div
                key={subTab.key}
                onClick={() => setActiveSubTab(subTab.key as any)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeSubTab === subTab.key ? subTab.color : 'transparent',
                  color: activeSubTab === subTab.key ? '#fff' : '#666',
                  boxShadow: activeSubTab === subTab.key ? `0 2px 6px ${subTab.color}40` : 'none',
                  transform: activeSubTab === subTab.key ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {subTab.label}
              </div>
            ))}
          </div>
        )}

        {/* 机遇指数子选项卡 */}
        {activeTab === 'opportunity' && (
          <div
            style={{
              display: 'flex',
              background: '#f0fdf4',
              borderRadius: '16px',
              padding: '4px',
              gap: '4px',
              marginTop: '8px',
            }}
          >
            {[
              { key: 'academic', label: '学业发展', color: '#722ed1' },
              { key: 'career', label: '职业回报', color: '#13c2c2' },
              { key: 'industry', label: '产业前景', color: '#eb2f96' },
              { key: 'growth', label: '成长空间', color: '#fa541c' },
            ].map((subTab) => (
              <div
                key={subTab.key}
                onClick={() => setActiveOpportunitySubTab(subTab.key as any)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeOpportunitySubTab === subTab.key ? subTab.color : 'transparent',
                  color: activeOpportunitySubTab === subTab.key ? '#fff' : '#666',
                  boxShadow:
                    activeOpportunitySubTab === subTab.key ? `0 2px 6px ${subTab.color}40` : 'none',
                  transform: activeOpportunitySubTab === subTab.key ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {subTab.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 滚动容器 */}
      <div
        className="major-list-card-area"
        ref={listAreaRef}
        style={{
          height:
            activeTab === 'passion' || activeTab === 'opportunity'
              ? 'calc(100vh - 240px)'
              : 'calc(100vh - 200px)',
          overflow: 'auto',
        }}
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
          {/* <div
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
          </div> */}
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
              displayMajors.map((item: any, idx: number) => {
                // 检查当前专业是否已收藏
                const isFavorite = isMajorFavorite(item.majorCode);
                const isClicked = clickedMajorCode === String(item.majorCode);
                // 计算在完整列表中的索引
                const fullListIndex = majors.findIndex(
                  (major: any) => major.majorCode === item.majorCode
                );
                const isRecommendedMajor = recommendFlags[fullListIndex];
                // 判断是否需要插入分割线
                const needDivider =
                  firstNonMatchingIndex !== -1 && fullListIndex === firstNonMatchingIndex;
                return (
                  <React.Fragment key={item.majorCode}>
                    {needDivider && (
                      <div
                        style={{
                          margin: '16px 0',
                          padding: '12px 24px',
                          background: '#f8fafc',
                          color: '#666',
                          fontSize: 14,
                          borderTop: '1px solid #e5e7eb',
                          borderBottom: '1px solid #e5e7eb',
                          textAlign: 'center',
                          fontWeight: 500,
                        }}
                      >
                        以下专业，根据院校招生简章选科要求，您暂时不可报考，规划长远发展时可作为参考。
                      </div>
                    )}
                    <div
                      key={item.majorCode}
                      data-major-code={item.majorCode}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        padding: '0 8px',
                        marginBottom: '8px',
                        borderBottom:
                          idx === displayMajors.length - 1 ? 'none' : '1px solid #f0f0f0',
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease', // 添加过渡动画
                        boxShadow:
                          isClicked && activeTab !== 'passion' && activeTab !== 'opportunity'
                            ? '0 2px 8px rgba(24, 144, 255, 0.15)'
                            : 'none', // 点击时的阴影效果
                        transform:
                          isClicked && activeTab !== 'passion' && activeTab !== 'opportunity'
                            ? 'translateX(2px)'
                            : 'translateX(0)', // 轻微向右移动
                        color: isRecommendedMajor ? '#333' : '#bbb', // 推荐深色，不推荐淡色
                        background:
                          isClicked && activeTab !== 'passion' && activeTab !== 'opportunity'
                            ? (() => {
                                switch (activeTab) {
                                  case 'development':
                                    return '#dbeafe';
                                  case 'passion':
                                    return '#fee2e2';
                                  case 'opportunity':
                                    return '#d1fae5';
                                  default:
                                    return '#e6f7ff';
                                }
                              })()
                            : isRecommendedMajor
                              ? (() => {
                                  switch (activeTab) {
                                    case 'development':
                                      return '#eff6ff';
                                    case 'passion':
                                      return '#fef2f2';
                                    case 'opportunity':
                                      return '#f0fdf4';
                                    default:
                                      return '#fff7e6';
                                  }
                                })()
                              : '#f3f4f6', // 不推荐灰色
                        borderLeft:
                          isClicked && activeTab !== 'passion' && activeTab !== 'opportunity'
                            ? (() => {
                                switch (activeTab) {
                                  case 'development':
                                    return '4px solid #2563eb';
                                  case 'passion':
                                    return '4px solid #dc2626';
                                  case 'opportunity':
                                    return '4px solid #059669';
                                  default:
                                    return '4px solid #1890ff';
                                }
                              })()
                            : isRecommendedMajor
                              ? (() => {
                                  switch (activeTab) {
                                    case 'development':
                                      return '3px solid #2563eb';
                                    case 'passion':
                                      return '3px solid #dc2626';
                                    case 'opportunity':
                                      return '3px solid #059669';
                                    default:
                                      return '3px solid #fa8c16';
                                  }
                                })()
                              : 'none', // 不推荐无边框
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'left',
                          width: '100%',
                        }}
                      >
                        <div
                          onClick={() => handleMajorItemClick(item, isFavorite)}
                          style={{
                            flex: 1,
                            position: 'relative',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: 15,
                          }}
                        >
                          {/* 专业编号和名称 */}
                          {activeTab !== 'passion' && activeTab !== 'opportunity' && (
                            <span style={{ color: '#666', marginRight: 8 }}>{item.majorCode}</span>
                          )}
                          <span style={{ marginRight: 15 }} title={item.majorName}>
                            {truncateMajorName(item.majorName)}
                          </span>
                          {/* 跳转箭头 */}
                          <span style={{ color: '#bbb', fontSize: 18 }}>{'>'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {/* 分数显示 */}
                          <span
                            onClick={() => {
                              if (activeTab === 'development')
                                navigator(
                                  `/major/majorjobintro?type=major&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                                );
                            }}
                            style={{
                              color: (() => {
                                switch (activeTab) {
                                  case 'development':
                                    return '#2563eb';
                                  case 'passion':
                                    return '#dc2626';
                                  case 'opportunity':
                                    return '#059669';
                                  default:
                                    return '#333';
                                }
                              })(),
                              fontSize: 15,
                              marginRight: 8,
                              fontWeight: 500,
                            }}
                          >
                            {getScoreDisplayText(item)}
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
                            {isFavorite ? (
                              <StarFilled style={{ color: '#fadb14', fontSize: 20 }} />
                            ) : (
                              <StarOutlined style={{ color: '#ccc', fontSize: 20 }} />
                            )}
                            <span style={{ fontSize: 13, marginLeft: 2 }}>收藏</span>
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          width: '100%',
                          padding: '8px 0',
                          gap: '6px',
                        }}
                      >
                        {/* 专业描述 */}
                        {activeTab === 'development' && (
                          <div
                            className="major-list-item-content"
                            onClick={() => {
                              navigator(
                                `/major/majorjobintro?type=major&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                              );
                            }}
                          >
                            {item.majorName}是{item.majorBrief} {'>'}
                          </div>
                        )}

                        {/* 学习特质评分 */}
                        {activeTab !== 'opportunity' && (
                          <div className="major-list-item-content">
                            {(!activeSubTab || activeTab === 'development') && (
                              <span
                                onClick={() => {
                                  navigator(
                                    `/major/studyTrait?type=lexue&majorCode=${item.majorCode}&majorName=${item.majorName}`
                                  );
                                }}
                              >
                                乐学
                                <span style={{ color: '#52c41a', fontWeight: 500 }}>
                                  {getCalcScore100(item.lexueScore)}分
                                </span>
                                {'>'}
                              </span>
                            )}
                            {(!activeSubTab || activeTab === 'development') && (
                              <span
                                onClick={() => {
                                  navigator(
                                    `/major/studyTrait?type=shanxue&majorCode=${item.majorCode}&majorName=${item.majorName}`
                                  );
                                }}
                              >
                                善学
                                <span style={{ color: '#1890ff', fontWeight: 500 }}>
                                  {getCalcScore100(item.shanxueScore)}分
                                </span>
                                {'>'}
                              </span>
                            )}
                            {(!activeSubTab || activeTab === 'development') && (
                              <span
                                onClick={() => {
                                  navigator(
                                    `/major/studyTrait?type=yanxue&majorCode=${item.majorCode}&majorName=${item.majorName}`
                                  );
                                }}
                              >
                                厌学
                                <span style={{ color: '#fa8c16', fontWeight: 500 }}>
                                  {getCalcScore100(item.yanxueDeduction)}分
                                </span>
                                {'>'}
                              </span>
                            )}
                            {(!activeSubTab || activeTab === 'development') && (
                              <span
                                onClick={() => {
                                  navigator(
                                    `/major/studyTrait?type=tiaozhan&majorCode=${item.majorCode}&majorName=${item.majorName}`
                                  );
                                }}
                              >
                                阻学
                                <span style={{ color: '#f5222d', fontWeight: 500 }}>
                                  {getCalcScore100(item.tiaozhanDeduction)}分
                                </span>
                                {'>'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 发展评分 */}
                        {activeTab !== 'passion' && (
                          <>
                            <div
                              className="major-list-item-content"
                              onClick={() => {
                                navigator(
                                  `/major/majorjobintro?type=academic&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                                );
                              }}
                            >
                              {(!activeOpportunitySubTab || activeTab === 'development') && (
                                <span>
                                  学业发展
                                  <span style={{ color: '#722ed1', fontWeight: 500 }}>
                                    {getCalcScore(item.academicDevelopmentScore)}分
                                  </span>
                                  {'>'}
                                </span>
                              )}
                              {(!activeOpportunitySubTab || activeTab === 'development') && (
                                <span>
                                  职业回报
                                  <span style={{ color: '#13c2c2', fontWeight: 500 }}>
                                    {getCalcScore(item.careerDevelopmentScore)}分
                                  </span>
                                  {'>'}
                                </span>
                              )}
                            </div>
                            <div
                              className="major-list-item-content"
                              onClick={() =>
                                navigator(
                                  `/major/majorjobintro?type=industry&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                                )
                              }
                            >
                              {(!activeOpportunitySubTab || activeTab === 'development') && (
                                <span>
                                  产业前景
                                  <span style={{ color: '#eb2f96', fontWeight: 500 }}>
                                    {getCalcScore(item.industryProspectsScore)}分
                                  </span>
                                  {'>'}
                                </span>
                              )}
                              {(!activeOpportunitySubTab || activeTab === 'development') && (
                                <span>
                                  成长空间
                                  <span style={{ color: '#fa541c', fontWeight: 500 }}>
                                    {getCalcScore(item.growthPotentialScore)}分
                                  </span>
                                  {'>'}
                                </span>
                              )}
                            </div>
                          </>
                        )}

                        {/* 招生院校 */}
                        {activeTab === 'development' && (
                          <div
                            className="major-list-item-content"
                            onClick={() => {
                              navigator(
                                `/major/majorschools?majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                              );
                            }}
                          >
                            招生院校{item.schoolCount}所 {'>'}
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
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
      {majors.length <= 10 && (
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
            <div className="text-2xl font-semibold text-gray-800 mb-4">
              选择最爱专业与理想院校，发现热爱！
            </div>

            {/* 功能介绍 */}
            <div className="space-y-3 mb-6 text-left">
              <div className="flex items-center space-x-2">
                <span className="text-blue-500 font-semibold" style={{ width: '50px' }}>
                  自评：
                </span>
                <span className="text-gray-700">168座&ldquo;心桥&rdquo;，多维度走进内心世界</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500 font-semibold" style={{ width: '50px' }}>
                  专业：
                </span>
                <span className="text-gray-700">
                  所有1914个大学专业，结合现在与未来，看见&ldquo;最爱&rdquo;！
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-500 font-semibold" style={{ width: '50px' }}>
                  意向：
                </span>
                <span className="text-gray-700">多层次筛选，让选择更贴近&ldquo;热爱&rdquo;！</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-orange-500 font-semibold" style={{ width: '50px' }}>
                  志愿：
                </span>
                <span className="text-gray-700">多方位对比，发现&ldquo;至爱理想&rdquo;！</span>
              </div>
            </div>

            {/* 价格信息 */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-500 mb-1">¥88</div>
              <div className="text-red-600 font-semibold text-sm">亲友价！</div>
            </div>
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

      {/* 提示弹窗 */}
      <Modal
        title={
          <div
            style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}
          >
            💡 使用提示
          </div>
        }
        open={isTipModalVisible}
        onCancel={handleTipModalClose}
        footer={null}
        width={400}
        centered
        className="rounded-2xl"
        style={{ top: '20%' }}
      >
        <div style={{ padding: '20px 0' }}>
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: '收藏功能',
                children: (
                  <div
                    style={{
                      padding: '16px 0',
                      lineHeight: '1.8',
                      fontSize: '14px',
                      color: '#333',
                    }}
                  >
                    <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                      1. &ldquo;点亮&rdquo;收藏，喜欢专业会自动进入&ldquo;意向&rdquo;频道备选
                    </div>
                    <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                      2. 所有字段均可点击查看详情
                    </div>
                  </div>
                ),
              },
              {
                key: '2',
                label: '专业分析',
                children: (
                  <div
                    style={{
                      padding: '16px 0',
                      lineHeight: '1.8',
                      fontSize: '14px',
                      color: '#333',
                    }}
                  >
                    <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                      3.
                      建议特别关注&ldquo;乐学/善学/厌学/阻学特质&rdquo;，了解为什么自己可能喜欢与擅长该专业
                    </div>
                    <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                      4.
                      请详细了解学业发展、职业回报、产业前景、成长空间等&ldquo;外部机遇&rdquo;相关内容，基于更全面的评估，决定是否&ldquo;收藏&rdquo;为意向专业
                    </div>
                  </div>
                ),
              },
            ]}
            style={{ marginTop: '8px' }}
          />

          {/* 底部复选框选项 */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px 20px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
            }}
          >
            <div
              style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}
            >
              请选择您的偏好（可多选）：
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Checkbox
                checked={userChoices.choice1}
                onChange={(e) => handleChoiceChange('choice1', e.target.checked)}
                style={{ fontSize: '13px' }}
              >
                今天不显示此提示
              </Checkbox>
            </div>
            <div>
              <Checkbox
                checked={userChoices.choice2}
                onChange={(e) => handleChoiceChange('choice2', e.target.checked)}
                style={{ fontSize: '13px' }}
              >
                以后都不显示此提示
              </Checkbox>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Button
              type="primary"
              onClick={handleTipModalConfirm}
              style={{
                background: '#2563eb',
                border: 'none',
                borderRadius: '20px',
                height: '40px',
                width: '120px',
                fontSize: '16px',
              }}
            >
              我知道了
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MajorPage;
