// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { Input, Button, Modal, message, Spin, Tabs, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  setActiveTab,
  setActiveSubTab,
  setActiveOpportunitySubTab,
} from '../../store/slices/majorListSlice';
import BottomNav from '../comm/bottom';
import CommonSelect, { SelectOptionData } from '../comm/CommonSelect';
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
  // tab说明文字展开状态
  const [isTabDescriptionExpanded, setIsTabDescriptionExpanded] = useState(false);
  // 使用Redux管理tab状态
  const dispatch = useDispatch();
  const { activeTab, activeSubTab, activeOpportunitySubTab } = useSelector(
    (state: RootState) => state.majorList
  );
  // 发展潜能选择相关状态
  const [selectedDevelopmentGroup, setSelectedDevelopmentGroup] = useState<string>('');
  const [developmentOptions, setDevelopmentOptions] = useState<SelectOptionData[]>([]);
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

        // 在相同分组内，根据字段类型进行排序
        const aValue = Number(a[sortField] || 0);
        const bValue = Number(b[sortField] || 0);

        // 厌学和阻学字段使用正序排序（从低到高），其他字段使用倒序排序（从高到低）
        if (sortField === 'yanxueDeduction' || sortField === 'tiaozhanDeduction') {
          return aValue - bValue; // 从低到高排序
        } else {
          return bValue - aValue; // 从高到低排序
        }
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
   * 根据当前tab状态获取对应的分组数据源类型
   * @returns 分组数据源类型
   */
  const getCurrentGroupDataSource = useCallback(() => {
    // 如果是热爱能量tab
    if (activeTab === 'passion') {
      if (activeSubTab === 'le') {
        return 'lexueScore'; // 乐学
      } else if (activeSubTab === 'shan') {
        return 'shanxueScore'; // 善学
      } else if (activeSubTab === 'yan') {
        return 'yanxueDeduction'; // 厌学
      } else if (activeSubTab === 'zu') {
        return 'tiaozhanDeduction'; // 阻学
      } else {
        return 'score'; // 热爱能量（无子tab选中）
      }
    }
    // 如果是机遇指数tab
    else if (activeTab === 'opportunity') {
      if (activeOpportunitySubTab === 'academic') {
        return 'academicDevelopmentScore'; // 学业发展
      } else if (activeOpportunitySubTab === 'career') {
        return 'careerDevelopmentScore'; // 职业回报
      } else if (activeOpportunitySubTab === 'industry') {
        return 'industryProspectsScore'; // 产业前景
      } else if (activeOpportunitySubTab === 'growth') {
        return 'growthPotentialScore'; // 成长空间
      } else {
        return 'opportunityScore'; // 机遇指数（无子tab选中）
      }
    }
    // 默认返回发展潜能
    return 'developmentPotential';
  }, [activeTab, activeSubTab, activeOpportunitySubTab]);

  /**
   * 根据当前tab状态获取对应的提示词
   * @returns 提示词文本
   */
  const getPlaceholderText = useCallback(() => {
    // 如果是热爱能量tab
    if (activeTab === 'passion') {
      if (activeSubTab === 'le') {
        return '选择乐学范围';
      } else if (activeSubTab === 'shan') {
        return '选择善学范围';
      } else if (activeSubTab === 'yan') {
        return '选择厌学范围';
      } else if (activeSubTab === 'zu') {
        return '选择阻学范围';
      } else {
        return '选择热爱能量范围';
      }
    } else if (activeTab === 'opportunity') {
      if (activeOpportunitySubTab === 'academic') {
        return '选择学业发展范围';
      } else if (activeOpportunitySubTab === 'career') {
        return '选择职业回报范围';
      } else if (activeOpportunitySubTab === 'industry') {
        return '选择产业前景范围';
      } else if (activeOpportunitySubTab === 'growth') {
        return '选择成长空间范围';
      } else {
        return '选择机遇指数范围';
      }
    }
    // 默认返回发展潜能
    return '选择发展潜能范围';
  }, [activeTab, activeSubTab, activeOpportunitySubTab]);

  /**
   * 根据当前tab状态更新发展潜能选择器的选项数据
   */
  const updateDevelopmentOptions = useCallback(() => {
    const cachedGroupedResults = sessionStorage.getItem('major-list-grouped-results');
    if (cachedGroupedResults) {
      try {
        const groupedResults = JSON.parse(cachedGroupedResults);
        const dataSource = getCurrentGroupDataSource();
        
        // 根据数据源类型获取对应的分组数据
        let sourceData = null;
        if (dataSource === 'developmentPotential' && groupedResults.developmentPotential) {
          sourceData = groupedResults.developmentPotential;
        } else if (dataSource === 'score' && groupedResults.score) {
          sourceData = groupedResults.score;
        } else if (dataSource === 'lexueScore' && groupedResults.lexueScore) {
          sourceData = groupedResults.lexueScore;
        } else if (dataSource === 'shanxueScore' && groupedResults.shanxueScore) {
          sourceData = groupedResults.shanxueScore;
        } else if (dataSource === 'yanxueDeduction' && groupedResults.yanxueDeduction) {
          sourceData = groupedResults.yanxueDeduction;
        } else if (dataSource === 'tiaozhanDeduction' && groupedResults.tiaozhanDeduction) {
          sourceData = groupedResults.tiaozhanDeduction;
        } else if (dataSource === 'opportunityScore' && groupedResults.opportunityScore) {
          sourceData = groupedResults.opportunityScore;
        } else if (dataSource === 'academicDevelopmentScore' && groupedResults.academicDevelopmentScore) {
          sourceData = groupedResults.academicDevelopmentScore;
        } else if (dataSource === 'careerDevelopmentScore' && groupedResults.careerDevelopmentScore) {
          sourceData = groupedResults.careerDevelopmentScore;
        } else if (dataSource === 'industryProspectsScore' && groupedResults.industryProspectsScore) {
          sourceData = groupedResults.industryProspectsScore;
        } else if (dataSource === 'growthPotentialScore' && groupedResults.growthPotentialScore) {
          sourceData = groupedResults.growthPotentialScore;
        }

        if (sourceData && Array.isArray(sourceData)) {
          const optionsData = sourceData.map((group: any) => ({
            id: group.groupId,
            label: group.description,
            count: group.count,
          }));
          setDevelopmentOptions(optionsData);
        } else {
          setDevelopmentOptions([]);
        }
      } catch (error) {
        console.error('解析分组数据失败:', error);
        setDevelopmentOptions([]);
      }
    }
  }, [getCurrentGroupDataSource]);

  // 当tab状态变化时，更新发展潜能选择器的选项数据并清除选择
  useEffect(() => {
    // 清除当前选择状态
    setSelectedDevelopmentGroup('');
    // 更新选项数据
    updateDevelopmentOptions();
  }, [activeTab, activeSubTab, activeOpportunitySubTab, updateDevelopmentOptions]);

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
          const groupedResults = (response.data && response.data.groupedResults) || {};
          // const calculatedAt = response.data && response.data.calculatedAt;

          // 为后续过滤功能保存分组数据到 sessionStorage
          if (groupedResults && Object.keys(groupedResults).length > 0) {
            sessionStorage.setItem('major-list-grouped-results', JSON.stringify(groupedResults));
            // 分组数据已保存到 sessionStorage，通过 updateDevelopmentOptions 函数处理
          }
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
        const intentions = response.data.schoolsWithMajor || [];
        setMajorIntentions(intentions);
        // 缓存收藏数据到 sessionStorage
        sessionStorage.setItem('major-list-cached-intentions', JSON.stringify(intentions));
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

  // 恢复tab状态 - 从sessionStorage中恢复
  useEffect(() => {
    const savedTabState = sessionStorage.getItem('major-list-tab-state');
    if (savedTabState) {
      try {
        const tabState = JSON.parse(savedTabState);
        if (tabState.activeTab) {
          dispatch(setActiveTab(tabState.activeTab));
        }
        if (tabState.activeSubTab) {
          dispatch(setActiveSubTab(tabState.activeSubTab));
        }
        if (tabState.activeOpportunitySubTab) {
          dispatch(setActiveOpportunitySubTab(tabState.activeOpportunitySubTab));
        }
      } catch (error) {
        console.error('恢复tab状态失败:', error);
      }
    }
  }, [dispatch]);

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
   * 处理发展潜能选择
   */
  const handleDevelopmentSelect = useCallback(
    (groupId: string) => {
      setSelectedDevelopmentGroup(groupId);
      setCurrentPage(1);
      setHasMore(true);

      // 从 sessionStorage 获取分组数据
      const cachedGroupedResults = sessionStorage.getItem('major-list-grouped-results');
      if (cachedGroupedResults) {
        try {
          const groupedResults = JSON.parse(cachedGroupedResults);
          const dataSource = getCurrentGroupDataSource();
          
          // 根据数据源类型获取对应的分组数据
          let sourceData = null;
          if (dataSource === 'developmentPotential' && groupedResults.developmentPotential) {
            sourceData = groupedResults.developmentPotential;
          } else if (dataSource === 'score' && groupedResults.score) {
            sourceData = groupedResults.score;
          } else if (dataSource === 'lexueScore' && groupedResults.lexueScore) {
            sourceData = groupedResults.lexueScore;
          } else if (dataSource === 'shanxueScore' && groupedResults.shanxueScore) {
            sourceData = groupedResults.shanxueScore;
          } else if (dataSource === 'yanxueDeduction' && groupedResults.yanxueDeduction) {
            sourceData = groupedResults.yanxueDeduction;
          } else if (dataSource === 'tiaozhanDeduction' && groupedResults.tiaozhanDeduction) {
            sourceData = groupedResults.tiaozhanDeduction;
          } else if (dataSource === 'opportunityScore' && groupedResults.opportunityScore) {
            sourceData = groupedResults.opportunityScore;
          } else if (dataSource === 'academicDevelopmentScore' && groupedResults.academicDevelopmentScore) {
            sourceData = groupedResults.academicDevelopmentScore;
          } else if (dataSource === 'careerDevelopmentScore' && groupedResults.careerDevelopmentScore) {
            sourceData = groupedResults.careerDevelopmentScore;
          } else if (dataSource === 'industryProspectsScore' && groupedResults.industryProspectsScore) {
            sourceData = groupedResults.industryProspectsScore;
          } else if (dataSource === 'growthPotentialScore' && groupedResults.growthPotentialScore) {
            sourceData = groupedResults.growthPotentialScore;
          }

          if (sourceData && Array.isArray(sourceData)) {
            const selectedGroup = sourceData.find((group: any) => group.groupId === groupId);
            if (selectedGroup && selectedGroup.majorCodes) {
              // 根据选中的分组过滤专业列表
              const filteredMajors = originalMajors.filter((major: any) =>
                selectedGroup.majorCodes.includes(major.majorCode)
              );
              const sortedData = sortMajors(filteredMajors);
              setMajors(sortedData);
              return;
            }
          }
        } catch (error) {
          console.error('解析分组数据失败:', error);
        }
      }

      // 如果无法获取分组数据，显示所有专业
      const sortedData = sortMajors(originalMajors);
      setMajors(sortedData);
    },
    [originalMajors, sortMajors, getCurrentGroupDataSource]
  );

  /**
   * 清除发展潜能选择
   */
  const handleDevelopmentClear = useCallback(() => {
    setSelectedDevelopmentGroup('');
    setCurrentPage(1);
    setHasMore(true);
    const sortedData = sortMajors(originalMajors);
    setMajors(sortedData);
  }, [originalMajors, sortMajors]); /**
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
            message.success('取消收藏成功，已成功从意向列表中移除。');
            // 重新获取收藏列表以更新状态
            await fetchMajorIntentions(true);
          }
        } else {
          // 当前未收藏，执行收藏
          response = await toggleMajorIntention(String(majorCode));
          if (response && response.code === 200) {
            message.success('收藏成功，已成功加入意向列表。');
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
   * 保存当前tab状态到sessionStorage
   */
  const saveTabState = useCallback(() => {
    sessionStorage.setItem(
      'major-list-tab-state',
      JSON.stringify({
        activeTab,
        activeSubTab,
        activeOpportunitySubTab,
      })
    );
  }, [activeTab, activeSubTab, activeOpportunitySubTab]);

  /**
   * 带状态保存的导航函数
   */
  const navigateWithState = useCallback(
    (path: string) => {
      saveTabState();
      navigator(path);
    },
    [saveTabState, navigator]
  );

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

      // 使用带状态保存的导航函数
      navigateWithState(
        `/major/majorlovedetail?majorCode=${item.majorCode}&&majorName=${item.majorName}&score=${item.score}&isFavorite=${isFavorite}`
      );
    },
    [saveScrollPosition, saveClickedMajorCode, handleMajorClick, navigateWithState]
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
    sessionStorage.removeItem('major-list-tab-state'); // 清除tab状态
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
    return name.length > 12 ? name.substring(0, 12) + '...' : name;
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
            return { text: '乐学', score: Math.ceil((item.lexueScore ?? 0) * 100) + '分' };
          case 'shan':
            return { text: '善学', score: Math.ceil((item.shanxueScore ?? 0) * 100) + '分' };
          case 'yan':
            return { text: '厌学', score: Math.ceil((item.yanxueDeduction ?? 0) * 100) + '分' };
          case 'zu':
            return { text: '阻学', score: Math.ceil((item.tiaozhanDeduction ?? 0) * 100) + '分' };
          default:
            return { text: '热爱能量', score: Math.ceil(Number(item.score || '0') * 100) + '分' };
        }
      }

      // 如果选择了机遇指数的子选项卡
      if (activeTab === 'opportunity' && activeOpportunitySubTab) {
        switch (activeOpportunitySubTab) {
          case 'academic':
            return {
              text: '学业发展',
              score: Math.ceil(item.academicDevelopmentScore ?? 0) + '分',
            };
          case 'career':
            return { text: '职业回报', score: Math.ceil(item.careerDevelopmentScore ?? 0) + '分' };
          case 'industry':
            return { text: '产业前景', score: Math.ceil(item.industryProspectsScore ?? 0) + '分' };
          case 'growth':
            return { text: '成长空间', score: Math.ceil(item.growthPotentialScore ?? 0) + '分' };
          default:
            return { text: '机遇指数', score: Math.ceil(item.opportunityScore ?? 0) + '分' };
        }
      }

      // 主选项卡显示
      switch (activeTab) {
        case 'development':
          return { text: '发展潜能', score: Math.ceil(item.developmentPotential ?? 0) + '分' };
        case 'passion':
          return { text: '热爱能量', score: Math.ceil(Number(item.score || '0') * 100) + '分' };
        case 'opportunity':
          return { text: '机遇指数', score: Math.ceil(item.opportunityScore ?? 0) + '分' };
        default:
          return { text: '发展潜能', score: Math.ceil(item.developmentPotential ?? 0) + '分' };
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

  /**
   * 获取当前tab的说明文字
   */
  const getTabDescription = useCallback(() => {
    switch (activeTab) {
      case 'development':
        return '不同喜欢与天赋在面对各专业微观环境时所具有的热爱能量、面对各专业宏观环境时所拥有的发展机遇，所决定的"学习过程愉快、效率高、效果好"，及"工作干得顺、赚得多、前景光明"。';
      case 'passion':
        return '热爱能量——微观环境中，更偏爱、更具动力，更擅长、更具能力的专业。';
      case 'opportunity':
        return '机遇指数——宏观环境下，更顺利、更具发展前景的专业。';
      default:
        return '';
    }
  }, [activeTab]);

  /**
   * 切换tab说明文字的展开收起状态
   */
  const toggleTabDescription = useCallback(() => {
    setIsTabDescriptionExpanded((prev) => !prev);
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
        />{' '}
        <Button
          type="primary"
          shape="round"
          style={{ marginLeft: 12, width: 64, height: 36, background: '#2563eb', border: 'none' }}
          onClick={handleSearch}
        >
          搜索
        </Button>
        {/* 发展潜能选择器 */}
        <div
          style={{
            position: 'fixed',
            top: '68px',
            left: 0,
            right: 0,
            zIndex: 999,
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            padding: '8px 16px',
          }}
        >
          <CommonSelect
            data={developmentOptions} 
            placeholder={getPlaceholderText()}
            onSelect={handleDevelopmentSelect}
            onClear={handleDevelopmentClear}
            allowClear={true}
            showCount={true}
            width="100%"
          />
        </div>
      </div>

      {/* 为固定搜索栏留出空间 */}
      <div style={{ height: '116px' }}></div>

      <div
        style={{
          height: (() => {
            // 基础高度：主选项卡 + 子选项卡
            let baseHeight = 72;

            if (activeTab === 'passion' || activeTab === 'opportunity') {
              baseHeight = 115; // 主选项卡 + 子选项卡

              // 如果有子Tab说明文字，需要额外增加高度
              if (
                (activeTab === 'passion' && activeSubTab) ||
                (activeTab === 'opportunity' && activeOpportunitySubTab)
              ) {
                baseHeight += 50; // 子Tab说明文字的高度（包含margin和padding）
              }
            }

            return baseHeight;
          })(),
        }}
      ></div>
      {/* 选项卡区域 */}
      <div
        style={{
          position: 'fixed',
          top: '115px',
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
            { key: 'passion', label: '热爱能量', icon: '♥', color: '#ff6b6b' },
            { key: 'opportunity', label: '机遇指数', icon: '★', color: '#10b981' },
          ].map((tab) => (
            <div
              key={tab.key}
              onClick={() => {
                dispatch(setActiveTab(tab.key as any));
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                borderRadius: '16px',
                fontSize: tab.key === 'development' ? '16px' : '14px', // 发展潜能字号大两号
                fontWeight: tab.key === 'development' ? 600 : 500, // 发展潜能字重也稍微加粗
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: activeTab === tab.key ? tab.color : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#666',
                boxShadow: activeTab === tab.key ? `0 2px 8px ${tab.color}30` : 'none',
                transform: activeTab === tab.key ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span
                style={{
                  marginRight: '4px',
                  fontSize: tab.key === 'development' ? '18px' : '16px',
                }}
              >
                {tab.icon}
              </span>
              {tab.label}
            </div>
          ))}
        </div>

        {/* 热爱能量子选项卡 */}
        {activeTab === 'passion' && (
          <>
            <div
              style={{
                display: 'flex',
                background: '#fef7f7',
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
                { key: 'zu', label: '阻学', color: '#ff7875' },
              ].map((subTab) => (
                <div
                  key={subTab.key}
                  onClick={() => dispatch(setActiveSubTab(subTab.key as any))}
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
                    boxShadow: activeSubTab === subTab.key ? `0 2px 6px ${subTab.color}30` : 'none',
                    transform: activeSubTab === subTab.key ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {subTab.label}
                </div>
              ))}
            </div>

            {/* 子Tab说明文字 */}
            {activeSubTab && (
              <div
                className="subtab-description"
                style={{
                  marginTop: '8px',
                  padding: '10px 16px',
                  background: (() => {
                    switch (activeSubTab) {
                      case 'le':
                        return '#f6ffed';
                      case 'shan':
                        return '#e6f7ff';
                      case 'yan':
                        return '#fff7e6';
                      case 'zu':
                        return '#fff2f0';
                      default:
                        return '#f8f9fa';
                    }
                  })(),
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: (() => {
                    switch (activeSubTab) {
                      case 'le':
                        return '#52c41a';
                      case 'shan':
                        return '#1890ff';
                      case 'yan':
                        return '#fa8c16';
                      case 'zu':
                        return '#ff7875';
                      default:
                        return '#666';
                    }
                  })(),
                  textAlign: 'center',
                  border: (() => {
                    switch (activeSubTab) {
                      case 'le':
                        return '1px solid #b7eb8f';
                      case 'shan':
                        return '1px solid #91d5ff';
                      case 'yan':
                        return '1px solid #ffd591';
                      case 'zu':
                        return '1px solid #ffccc7';
                      default:
                        return '1px solid #e9ecef';
                    }
                  })(),
                  lineHeight: '1.5',
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {activeSubTab === 'le' && '💚 内在开心体验带来持续动力'}
                {activeSubTab === 'shan' && '💙 自然而然学得更快更好更轻松'}
                {activeSubTab === 'yan' && '🟠 开心体验持续无法满足，导致动力衰减'}
                {activeSubTab === 'zu' && '🔴 思维与行为模式冲突，导致效率损耗'}
              </div>
            )}
          </>
        )}

        {/* 机遇指数子选项卡 */}
        {activeTab === 'opportunity' && (
          <>
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
                { key: 'academic', label: '学业发展', color: '#8b5cf6' },
                { key: 'career', label: '职业回报', color: '#06b6d4' },
                { key: 'industry', label: '产业前景', color: '#ec4899' },
                { key: 'growth', label: '成长空间', color: '#f97316' },
              ].map((subTab) => (
                <div
                  key={subTab.key}
                  onClick={() => dispatch(setActiveOpportunitySubTab(subTab.key as any))}
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
                    background:
                      activeOpportunitySubTab === subTab.key ? subTab.color : 'transparent',
                    color: activeOpportunitySubTab === subTab.key ? '#fff' : '#666',
                    boxShadow:
                      activeOpportunitySubTab === subTab.key
                        ? `0 2px 6px ${subTab.color}30`
                        : 'none',
                    transform: activeOpportunitySubTab === subTab.key ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {subTab.label}
                </div>
              ))}
            </div>

            {/* 机遇指数子Tab说明文字 */}
            {activeOpportunitySubTab && (
              <div
                className="subtab-description"
                style={{
                  marginTop: '8px',
                  padding: '10px 16px',
                  background: (() => {
                    switch (activeOpportunitySubTab) {
                      case 'academic':
                        return '#f3f0ff';
                      case 'career':
                        return '#e6fffb';
                      case 'industry':
                        return '#fdf2f8';
                      case 'growth':
                        return '#fff7ed';
                      default:
                        return '#f8f9fa';
                    }
                  })(),
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: (() => {
                    switch (activeOpportunitySubTab) {
                      case 'academic':
                        return '#8b5cf6';
                      case 'career':
                        return '#06b6d4';
                      case 'industry':
                        return '#ec4899';
                      case 'growth':
                        return '#f97316';
                      default:
                        return '#666';
                    }
                  })(),
                  textAlign: 'center',
                  border: (() => {
                    switch (activeOpportunitySubTab) {
                      case 'academic':
                        return '1px solid #c4b5fd';
                      case 'career':
                        return '1px solid #67e8f9';
                      case 'industry':
                        return '1px solid #f9a8d4';
                      case 'growth':
                        return '1px solid #fdba74';
                      default:
                        return '1px solid #e9ecef';
                    }
                  })(),
                  lineHeight: '1.5',
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {activeOpportunitySubTab === 'academic' && '🎓 升学畅通程度'}
                {activeOpportunitySubTab === 'career' && '💰 起薪与加薪幅度'}
                {activeOpportunitySubTab === 'industry' && '📈 产业发展前景乐观度'}
                {activeOpportunitySubTab === 'growth' && '🚀 升迁空间广阔度'}
              </div>
            )}
          </>
        )}
      </div>

      {/* 滚动容器 */}
      <div
        className="major-list-card-area"
        ref={listAreaRef}
        style={{
          height: (() => {
            // 基础高度计算
            let baseHeight = 280; // 搜索栏 + 发展潜能选择器 + 主选项卡

            if (activeTab === 'passion' || activeTab === 'opportunity') {
              baseHeight = 300; // 搜索栏 + 发展潜能选择器 + 主选项卡 + 子选项卡

              // 如果有子Tab说明文字，需要额外增加高度
              if (
                (activeTab === 'passion' && activeSubTab) ||
                (activeTab === 'opportunity' && activeOpportunitySubTab)
              ) {
                baseHeight += 50; // 子Tab说明文字的高度
              }
            }

            return `calc(100vh - ${baseHeight}px)`;
          })(),
          overflow: 'auto',
        }}
      >
        {/* Tab说明文字区域 - 只在没有子选项卡时显示 */}
        {!(
          (activeTab === 'passion' && activeSubTab) ||
          (activeTab === 'opportunity' && activeOpportunitySubTab)
        ) && (
          <div
            style={{
              margin: '16px 16px 8px 16px',
              padding: '16px 20px',
              background: (() => {
                switch (activeTab) {
                  case 'development':
                    return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                  case 'passion':
                    return 'linear-gradient(135deg, #fef7f7 0%, #fed7d7 100%)';
                  case 'opportunity':
                    return 'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)';
                  default:
                    return 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
                }
              })(),
              borderRadius: '16px',
              border: (() => {
                switch (activeTab) {
                  case 'development':
                    return '1px solid #3b82f6';
                  case 'passion':
                    return '1px solid #ef4444';
                  case 'opportunity':
                    return '1px solid #10b981';
                  default:
                    return '1px solid #d1d5db';
                }
              })(),
              boxShadow: (() => {
                switch (activeTab) {
                  case 'development':
                    return '0 4px 12px rgba(59, 130, 246, 0.15)';
                  case 'passion':
                    return '0 4px 12px rgba(239, 68, 68, 0.15)';
                  case 'opportunity':
                    return '0 4px 12px rgba(16, 185, 129, 0.15)';
                  default:
                    return '0 4px 12px rgba(0, 0, 0, 0.05)';
                }
              })(),
              cursor: 'pointer',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              transform: isTabDescriptionExpanded ? 'scale(1.02)' : 'scale(1)',
            }}
            onClick={toggleTabDescription}
          >
            {/* 装饰性背景元素 */}
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: (() => {
                  switch (activeTab) {
                    case 'development':
                      return 'rgba(59, 130, 246, 0.1)';
                    case 'passion':
                      return 'rgba(239, 68, 68, 0.1)';
                    case 'opportunity':
                      return 'rgba(16, 185, 129, 0.1)';
                    default:
                      return 'rgba(0, 0, 0, 0.05)';
                  }
                })(),
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isTabDescriptionExpanded ? 'scale(1.2)' : 'scale(1)',
                opacity: isTabDescriptionExpanded ? 0.8 : 0.5,
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: (() => {
                  switch (activeTab) {
                    case 'development':
                      return '#1e40af';
                    case 'passion':
                      return '#dc2626';
                    case 'opportunity':
                      return '#059669';
                    default:
                      return '#374151';
                  }
                })(),
                fontSize: '15px',
                fontWeight: 600,
                lineHeight: '1.6',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'normal',
                  maxHeight: isTabDescriptionExpanded ? '200px' : '24px',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: isTabDescriptionExpanded ? 1 : 0.8,
                }}
              >
                {getTabDescription()}
              </div>
              <div
                style={{
                  marginLeft: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: '4px',
                  borderRadius: '50%',
                  background: (() => {
                    switch (activeTab) {
                      case 'development':
                        return 'rgba(59, 130, 246, 0.1)';
                      case 'passion':
                        return 'rgba(239, 68, 68, 0.1)';
                      case 'opportunity':
                        return 'rgba(16, 185, 129, 0.1)';
                      default:
                        return 'rgba(0, 0, 0, 0.05)';
                    }
                  })(),
                  transform: isTabDescriptionExpanded ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <div
                  style={{
                    transition: 'all 0.3s ease',
                    transform: isTabDescriptionExpanded ? 'rotate(0deg)' : 'rotate(0deg)',
                  }}
                >
                  {isTabDescriptionExpanded ? (
                    <UpOutlined style={{ fontSize: '14px' }} />
                  ) : (
                    <DownOutlined style={{ fontSize: '14px' }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 专业列表卡片 */}
        <div
          className="major-list-card"
          style={{
            background: '#fff',
            borderRadius: 16,
            margin: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            minWidth: 'calc(100% - 32px)',
            border: '1px solid #f1f5f9',
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
                                    return '#ffeaea';
                                  case 'opportunity':
                                    return '#ecfdf5';
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
                                      return '#fef7f7';
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
                                    return '4px solid #ff6b6b';
                                  case 'opportunity':
                                    return '4px solid #10b981';
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
                                      return '3px solid #ff6b6b';
                                    case 'opportunity':
                                      return '3px solid #10b981';
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
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          <div>
                            {/* 专业名称 */}
                            <div style={{ marginRight: 15 }} title={item.majorName}>
                              {truncateMajorName(item.majorName)}
                            </div>
                            {/* 专业编号 */}
                            {activeTab !== 'passion' && activeTab !== 'opportunity' && (
                              <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                                {item.majorCode}
                              </div>
                            )}
                          </div>
                          {/* 跳转箭头 */}
                          <div
                            style={{
                              color: '#bbb',
                              fontSize: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {'>'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span
                            style={{ fontSize: 15, fontWeight: 500 }}
                            onClick={() => {
                              if (activeTab === 'development')
                                navigateWithState(
                                  `/major/majorjobintro?type=major&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                                );
                            }}
                          >
                            {getScoreDisplayText(item).text}
                          </span>
                          {/* 分数显示 */}
                          <span
                            onClick={() => {
                              if (activeTab === 'development')
                                navigateWithState(
                                  `/major/majorjobintro?type=major&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                                );
                            }}
                            style={{
                              color: (() => {
                                switch (activeTab) {
                                  case 'development':
                                    return '#2563eb';
                                  case 'passion':
                                    return '#ff6b6b';
                                  case 'opportunity':
                                    return '#10b981';
                                  default:
                                    return '#333';
                                }
                              })(),
                              fontSize: 15,
                              marginRight: 8,
                              fontWeight: 500,
                            }}
                          >
                            {getScoreDisplayText(item).score}
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
                              navigateWithState(
                                `/major/majorjobintro?type=major&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                              );
                            }}
                          >
                            {item.majorName}是{item.majorBrief} {'>'}
                          </div>
                        )}

                        {/* 学习特质评分 */}
                        {activeTab !== 'opportunity' && (
                          <>
                            {/* 热爱能量标识 */}
                            {activeTab === 'development' && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#333',
                                  fontWeight: 600,
                                  marginBottom: '4px',
                                  paddingLeft: '4px',
                                }}
                              >
                                ♥ 热爱能量
                              </div>
                            )}
                            <div className="major-list-item-content">
                              {(!activeSubTab || activeTab === 'development') && (
                                <span
                                  onClick={() => {
                                    navigateWithState(
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
                                    navigateWithState(
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
                                    navigateWithState(
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
                                    navigateWithState(
                                      `/major/studyTrait?type=tiaozhan&majorCode=${item.majorCode}&majorName=${item.majorName}`
                                    );
                                  }}
                                >
                                  阻学
                                  <span style={{ color: '#ff7875', fontWeight: 500 }}>
                                    {getCalcScore100(item.tiaozhanDeduction)}分
                                  </span>
                                  {'>'}
                                </span>
                              )}
                            </div>
                          </>
                        )}

                        {/* 发展评分 */}
                        {activeTab !== 'passion' && (
                          <>
                            {/* 热爱能量标识 */}
                            {activeTab === 'development' && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#333',
                                  fontWeight: 600,
                                  marginBottom: '4px',
                                  paddingLeft: '4px',
                                }}
                              >
                                ★ 机遇指数
                              </div>
                            )}
                            <div className="major-list-item-content">
                              {(!activeOpportunitySubTab || activeTab === 'development') && (
                                <span
                                  onClick={() => {
                                    navigateWithState(
                                      `/major/majorjobintro?type=major&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&anchor=academic`
                                    );
                                  }}
                                >
                                  学业发展
                                  <span style={{ color: '#8b5cf6', fontWeight: 500 }}>
                                    {getCalcScore(item.academicDevelopmentScore)}分
                                  </span>
                                  {'>'}
                                </span>
                              )}
                              {(!activeOpportunitySubTab || activeTab === 'development') && (
                                <span
                                  onClick={() => {
                                    navigateWithState(
                                      `/major/majorjobintro?type=academic&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&anchor=career`
                                    );
                                  }}
                                >
                                  职业回报
                                  <span style={{ color: '#06b6d4', fontWeight: 500 }}>
                                    {getCalcScore(item.careerDevelopmentScore)}分
                                  </span>
                                  {'>'}
                                </span>
                              )}
                            </div>
                            <div className="major-list-item-content">
                              {(!activeOpportunitySubTab || activeTab === 'development') && (
                                <span
                                  onClick={() =>
                                    navigateWithState(
                                      `/major/majorjobintro?type=industry&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&anchor=industry`
                                    )
                                  }
                                >
                                  产业前景
                                  <span style={{ color: '#ec4899', fontWeight: 500 }}>
                                    {getCalcScore(item.industryProspectsScore)}分
                                  </span>
                                  {'>'}
                                </span>
                              )}
                              {(!activeOpportunitySubTab || activeTab === 'development') && (
                                <span
                                  onClick={() =>
                                    navigateWithState(
                                      `/major/majorjobintro?type=industry&majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&anchor=growth`
                                    )
                                  }
                                >
                                  成长空间
                                  <span style={{ color: '#f97316', fontWeight: 500 }}>
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
                              navigateWithState(
                                `/major/majorschools?majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}`
                              );
                            }}
                          >
                            招生院校 {'>'}
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
                搜索
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
                搜索
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
          搜索
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
          搜索
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
                      1.
                      建议特别关注&ldquo;乐学/善学/厌学/阻学特质&rdquo;，了解为什么自己可能喜欢与擅长该专业
                    </div>
                    <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                      2.
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
            搜索
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MajorPage;
