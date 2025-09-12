import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message, Input, Tag } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  setDisplayCount,
  setAlternativeStatus,
  updateAlternativeStatus,
  setLoading,
  updateLoadingStatus,
  setRecommendCount,
  setAlternatives,
  setPageKey,
  setIsReturning,
  setHasInitialized,
  selectDisplayCount,
  selectAlternativeStatus,
  selectLoading,
  selectLoadingStatus,
  selectAlternatives,
  selectPageKey,
  selectHasInitialized,
  setActiveTab,
  selectActiveTab,
} from '../../store/slices/aiVolunteerSlice';
import { useScrollManager } from '../../hooks/useScrollManager';

import BottomNav from '../comm/bottom';
import StartWelcomePage from '../selfassessment/startWelcome';

import CommonSelect from '../comm/CommonSelect';
import {
  cancelAlternative,
  createMajorAlternative,
  getMajorAlternatives,
  getMajorGroup,
  getSuitability,
  nominate,
} from '../../config/volunteer';
import { getCurrentUser } from '../../config';

// 定义备选志愿项的类型（扩展自 API 返回的数据）
interface AlternativeItem {
  id: string;
  majorCode: string;
  name: string;
  schoolCode: string;
  schoolName: string;
  priority: number;
  createdAt: string;
  score?: number; // 热爱能量分数
  selected?: boolean; // 是否已入选
  historyScore?: any[]; // 历年分数
  group?: number; // 分组
  enrollmentRate?: number; // 升学率
  employmentRate?: number; // 就业率
  Rankdiff?: number; // 位次差
  RankdiffPer?: number; // 位次差百分比
  // 学校标签相关属性
  schoolFeature?: string; // 学校特色
  schoolNature?: string; // 学校性质（公办/民办）
  schoolLevel?: string; // 学校等级
  majorGroupId?: string; // 专业组ID
  majorGroupName?: string; // 专业组名称
  schoolCity?: string; // 学校所在城市
  provinceName?: string; // 省份名称
  cityName?: string; // 城市名称
  sortIndex?: number; // 手动排序索引
  developmentPotential?: number; // 发展潜能
  topDevelopmentCount?: number; // 高发展潜能专业数量
  position?: number; // 位置排序字段
  // 招生信息相关属性
  admissionsSite?: string; // 招生网址
  admissionsPhone?: string; // 招生电话
}

// 定义包含 count 和 groupId 的包装对象类型
interface AlternativeGroup {
  groupId: string;
  count: number;
  data: AlternativeItem[];
}

// 通用数据转换函数：将API返回的数据转换为AlternativeGroup类型
const convertToAlternativeGroup = (item: any): AlternativeGroup => {
  // 从 targetGroup 数组中提取数据
  const groupId = item.groupId || item.group?.toString() || '0';
  const count = item.count || 0;

  // 转换 data 数组中的每个项目
  const data = (item.data || []).map(
    (dataItem: any, index: number): AlternativeItem => ({
      id: `${dataItem.schoolCode}_${dataItem.major?.code || 'unknown'}_${index}`,
      majorCode: dataItem.major?.code || '', // 专业代码
      name: dataItem.major?.name || '', // 专业名称
      schoolCode: dataItem.schoolCode?.toString() || '',
      schoolName: dataItem.schoolName || '',
      priority: index + 1,
      createdAt: new Date().toISOString(),
      score: 0,
      selected: false,
      historyScore: dataItem.historyScores || [],
      group: dataItem.group || dataItem.groupId || 0,
      enrollmentRate: dataItem.enrollmentRate,
      employmentRate: dataItem.employmentRate,
      Rankdiff: dataItem.rankDiff,
      RankdiffPer: dataItem.rankDiffPer,
      schoolFeature: dataItem.schoolFeature || '',
      schoolNature: dataItem.schoolNature === 'public' ? 'public' : 'private',
      schoolLevel: '专科',
      majorGroupId: dataItem.majorGroupId?.toString() || '',
      majorGroupName: dataItem.majorGroupName || '',
      schoolCity: dataItem.cityName || '',
      provinceName: dataItem.provinceName || '',
      cityName: dataItem.cityName || '',
      sortIndex: index,
      developmentPotential: dataItem.major?.developmentPotential || 0,
      position: index,
      admissionsSite: '',
      admissionsPhone: '',
    })
  );

  return {
    groupId,
    count,
    data,
  };
};

// 定义分组后的备选志愿类型
interface GroupedAlternatives {
  group: number | string;
  result: AlternativeItem[];
  count?: number; // 添加 count 字段
}

// 定义按学校分组的类型
interface SchoolGroup {
  schoolCode: string;
  schoolName: string;
  majors: AlternativeItem[];
  isExpanded?: boolean; // 是否展开
}

// 定义专业组信息类型
interface MajorGroupItem {
  schoolCode: string;
  majorCode: string;
  subjectType: string;
  batch: string;
  num: string;
  enrollType: string;
  studyPeriod: string;
  province: string;
  tuition: string;
  remark: string;
  majorGroup: number;
  majorGroupInfo: string;
  majorGroupName: string;
  majorNameDetail: string;
  majorName: string;
  year: number;
}

const AiVolunteerPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 从 Redux 获取状态 - 使用选择器
  const alternatives = useSelector(selectAlternatives);
  const loading = useSelector(selectLoading);
  const loadingStatus = useSelector(selectLoadingStatus);
  const displayCount = useSelector(selectDisplayCount);
  const alternativeStatus = useSelector(selectAlternativeStatus);

  const hasInitialized = useSelector(selectHasInitialized);
  const activeTab = useSelector(selectActiveTab);
  const currentPageKey = useSelector(selectPageKey);

  //获取用户信息
  const [userInfo, setUserInfo] = useState<any>(null);
  useEffect(() => {
    const getUserInfo = async () => {
      const user = await getCurrentUser();
      setUserInfo(user.data);
    };
    getUserInfo();
  }, []);

  // 使用滚动管理hook
  const scrollManager = useScrollManager({
    pageKey: currentPageKey,
    itemHeight: 200,
    bufferSize: 5,
    throttleDelay: 100,
    enableVirtualScroll: true,
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 搜索相关状态
  const [searchText, setSearchText] = useState('');
  const [selectedSchoolNature, setSelectedSchoolNature] = useState<string>('all');
  const [selectedRankSegment, setSelectedRankSegment] = useState<string>('');
  const [showSearchTips, setShowSearchTips] = useState(false);
  // 添加缓存状态，避免重复加载相同数据
  const [lastLoadedGroupId, setLastLoadedGroupId] = useState<string | undefined>(undefined);
  // activeTab 现在由 Redux 管理
  // 添加浮层提示状态 - 从 localStorage 读取初始状态
  const [showFloatingTip, setShowFloatingTip] = useState(() => {
    // 检查 localStorage 中是否已关闭浮层提示
    const isFloatingTipClosed = localStorage.getItem('aiVolunteerFloatingTipClosed');
    return isFloatingTipClosed !== 'true'; // 如果已关闭则返回 false，否则返回 true
  });
  // 添加初始化标志，防止重复初始化
  const [isInitializing, setIsInitializing] = useState(false);

  // 添加精确的滚动位置恢复机制
  const [isRestoringScroll, setIsRestoringScroll] = useState(false);

  // 保存用户最后查看的项目ID
  // 处理浮层提示关闭的函数
  const handleCloseFloatingTip = useCallback(() => {
    setShowFloatingTip(false);
    // 将关闭状态保存到 localStorage，实现一次关闭后永久不显示
    localStorage.setItem('aiVolunteerFloatingTipClosed', 'true');
  }, []);

  const saveLastViewedItem = useCallback((itemId: string) => {
    localStorage.setItem('aiVolunteerLastViewedItem', itemId);
  }, []);

  // 精确的滚动位置恢复函数
  const preciseScrollRestore = useCallback(
    (scrollPosition: number) => {
      setIsRestoringScroll(true);

      // 使用window滚动
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScrollPosition = documentHeight - windowHeight;

      // 检查滚动位置是否超出页面高度
      if (scrollPosition > maxScrollPosition) {
        scrollPosition = maxScrollPosition;
      }

      // 如果滚动位置为0或很小，不需要恢复
      if (scrollPosition < 50) {
        setIsRestoringScroll(false);
        return;
      }

      // 如果需要更多数据，先加载
      const estimatedItemsNeeded = Math.ceil(scrollPosition / 200) + 10;
      const requiredItems = Math.max(estimatedItemsNeeded, 30);

      if (requiredItems > displayCount) {
        dispatch(setDisplayCount(requiredItems));

        setTimeout(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPosition);
            setIsRestoringScroll(false);
          });
        }, 300);
      } else {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
          setIsRestoringScroll(false);
        });
      }
    },
    [displayCount, dispatch]
  );

  // 定位到特定项目的函数
  const scrollToItem = useCallback(
    (itemId: string) => {
      // 查找项目在数据中的位置
      let itemIndex = -1;
      let currentIndex = 0;

      for (const group of alternatives) {
        for (const item of group.result) {
          if (item.id === itemId) {
            itemIndex = currentIndex;
            break;
          }
          currentIndex++;
        }
        if (itemIndex !== -1) break;
      }

      if (itemIndex !== -1) {
        // 计算项目的大概位置
        const itemHeight = 200;
        const estimatedScrollPosition = itemIndex * itemHeight;

        // 查找xunigundong元素
        const scrollElement = document.querySelector('.xunigundong');

        if (scrollElement) {
          // 使用xunigundong元素的滚动
          const maxScrollPosition = scrollElement.scrollHeight - scrollElement.clientHeight;

          // 检查滚动位置是否超出元素高度
          let finalScrollPosition = estimatedScrollPosition;
          if (estimatedScrollPosition > maxScrollPosition) {
            finalScrollPosition = maxScrollPosition;
          }

          // 确保有足够的数据显示
          const requiredItems = Math.max(itemIndex + 10, 30);

          if (requiredItems > displayCount) {
            dispatch(setDisplayCount(requiredItems));
            setTimeout(() => {
              scrollElement.scrollTo(0, finalScrollPosition);
            }, 300);
          } else {
            scrollElement.scrollTo(0, finalScrollPosition);
          }
        } else {
          // 降级到window滚动
          const documentHeight = document.documentElement.scrollHeight;
          const windowHeight = window.innerHeight;
          const maxScrollPosition = documentHeight - windowHeight;

          // 检查滚动位置是否超出页面高度
          let finalScrollPosition = estimatedScrollPosition;
          if (estimatedScrollPosition > maxScrollPosition) {
            finalScrollPosition = maxScrollPosition;
          }

          // 确保有足够的数据显示
          const requiredItems = Math.max(itemIndex + 10, 30);

          if (requiredItems > displayCount) {
            dispatch(setDisplayCount(requiredItems));
            setTimeout(() => {
              window.scrollTo(0, finalScrollPosition);
            }, 300);
          } else {
            window.scrollTo(0, finalScrollPosition);
          }
        }
      }
    },
    [alternatives, displayCount, dispatch]
  );

  // 点击外部关闭搜索提示
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-tips-container')) {
        setShowSearchTips(false);
      }
    };

    if (showSearchTips) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchTips]);

  // 生成页面唯一标识
  const pageKeyRef = useRef(`ai-volunteer-${Date.now()}`);

  // 滚动加载更多数据
  const handleScroll = useCallback(() => {
    if (isLoadingMore) return;

    // 使用window滚动
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // 当滚动到底部时加载更多
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      setIsLoadingMore(true);
      setTimeout(() => {
        dispatch(setDisplayCount(displayCount + 10)); // 每次增加10个项目
        setIsLoadingMore(false);
      }, 500);
    }
  }, [isLoadingMore, displayCount, dispatch]);

  // 添加全局滚动监听
  useEffect(() => {
    // 使用window滚动事件
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 保存滚动位置到 localStorage
  useEffect(() => {
    const handleScroll = () => {
      // 使用window滚动位置
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

      // 只有当滚动位置大于50时才保存，避免保存顶部位置
      if (currentScrollPosition > 50) {
        localStorage.setItem('aiVolunteerScrollPosition', currentScrollPosition.toString());
      }
    };

    // 节流处理滚动事件
    let timeoutId: NodeJS.Timeout;
    const throttledScrollHandler = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScrollHandler);

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dispatch]);

  // 页面离开时保存滚动位置 - 增强版
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScrollPosition > 50) {
        localStorage.setItem('aiVolunteerScrollPosition', currentScrollPosition.toString());
        sessionStorage.setItem('aiVolunteerFromDetail', 'true');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScrollPosition > 50) {
          localStorage.setItem('aiVolunteerScrollPosition', currentScrollPosition.toString());
          sessionStorage.setItem('aiVolunteerFromDetail', 'true');
        }
      }
    };

    // 监听页面离开事件
    const handlePageHide = () => {
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScrollPosition > 50) {
        localStorage.setItem('aiVolunteerScrollPosition', currentScrollPosition.toString());
        sessionStorage.setItem('aiVolunteerFromDetail', 'true');
      }
    };

    // 监听路由变化
    const handleRouteChange = () => {
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScrollPosition > 50) {
        localStorage.setItem('aiVolunteerScrollPosition', currentScrollPosition.toString());
        sessionStorage.setItem('aiVolunteerFromDetail', 'true');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // 优化的滚动位置恢复逻辑
  useEffect(() => {
    if (!loading && hasInitialized && !isRestoringScroll) {
      // 检查是否是从详情页返回
      const isFromDetail = sessionStorage.getItem('aiVolunteerFromDetail') === 'true';
      const savedScrollPosition = localStorage.getItem('aiVolunteerScrollPosition');

      if (isFromDetail && savedScrollPosition) {
        const scrollPosition = parseInt(savedScrollPosition, 10);

        // 清除标记，避免重复恢复
        sessionStorage.removeItem('aiVolunteerFromDetail');

        // 如果滚动位置为0或太小，不进行恢复
        if (scrollPosition <= 50) {
          return;
        }

        // 使用精确的滚动位置恢复机制
        // 检查是否有保存的最后查看项目
        const savedLastViewedItem = localStorage.getItem('aiVolunteerLastViewedItem');
        if (savedLastViewedItem) {
          // 优先定位到具体项目
          scrollToItem(savedLastViewedItem);
          localStorage.removeItem('aiVolunteerLastViewedItem');
        } else {
          // 使用滚动位置恢复，添加延迟确保DOM已渲染
          setTimeout(() => {
            preciseScrollRestore(scrollPosition);
          }, 500);
        }
      }
    }
  }, [
    loading,
    hasInitialized,
    alternatives.length,
    displayCount,
    preciseScrollRestore,
    scrollToItem,
    isRestoringScroll,
  ]);

  // 添加额外的滚动位置恢复检查
  useEffect(() => {
    if (!loading && hasInitialized && alternatives.length > 0) {
      // 延迟检查是否有需要恢复的滚动位置
      const timer = setTimeout(() => {
        const savedScrollPosition = localStorage.getItem('aiVolunteerScrollPosition');
        if (savedScrollPosition) {
          const scrollPosition = parseInt(savedScrollPosition, 10);
          if (scrollPosition > 0) {
            window.scrollTo(0, scrollPosition);
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loading, hasInitialized, alternatives.length]);

  // 添加更可靠的滚动位置恢复机制
  useEffect(() => {
    if (!loading && hasInitialized && alternatives.length > 0) {
      // 检查是否有保存的滚动位置且当前不在恢复状态
      const savedScrollPosition = localStorage.getItem('aiVolunteerScrollPosition');
      const isFromDetail = sessionStorage.getItem('aiVolunteerFromDetail') === 'true';

      if (savedScrollPosition && isFromDetail) {
        const scrollPosition = parseInt(savedScrollPosition, 10);
        if (scrollPosition > 50) {
          // 使用多个延迟确保DOM完全渲染
          setTimeout(() => {
            window.scrollTo(0, scrollPosition);
          }, 1500);

          setTimeout(() => {
            window.scrollTo(0, scrollPosition);
          }, 2000);
        }
      }
    }
  }, [loading, hasInitialized, alternatives.length]);

  // 页面离开时设置标记 - 已合并到上面的增强版中

  // 添加专业组详情相关状态
  const [showMajorGroupDialog, setShowMajorGroupDialog] = useState(false);
  const [majorGroupData, setMajorGroupData] = useState<MajorGroupItem[]>([]);
  const [currentMajorGroupInfo, setCurrentMajorGroupInfo] = useState<{
    majorGroupId: string;
    majorGroupName: string;
    schoolName: string;
  } | null>(null);

  // 添加位次段统计数据状态
  const [segmentStats, setSegmentStats] = useState<
    Array<{
      groupId: string;
      name: string;
      count: number;
    }>
  >([]);

  // 添加智能推荐数据状态
  const [smartRecommendData, setSmartRecommendData] = useState<AlternativeGroup[]>([]);
  const [smartRecommendLoading, setSmartRecommendLoading] = useState(false);

  // 添加发展潜能对话框状态
  const [showDevelopmentPotentialDialog, setShowDevelopmentPotentialDialog] = useState(false);

  // 辅助函数：处理导航跳转，设置返回标记
  const handleNavigation = useCallback(
    (url: string, options?: { replace?: boolean }, itemId?: string) => {
      // 保存当前滚动位置
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

      // 只有当滚动位置大于50时才保存和设置返回标记
      if (currentScrollPosition > 50) {
        // 设置标记，表示用户即将离开页面
        sessionStorage.setItem('aiVolunteerFromDetail', 'true');
        localStorage.setItem('aiVolunteerScrollPosition', currentScrollPosition.toString());
      }

      // 如果提供了项目ID，保存最后查看的项目
      if (itemId) {
        saveLastViewedItem(itemId);
      }

      // 执行导航
      return navigate(url, options);
    },
    [navigate, saveLastViewedItem]
  );

  // 按学校分组数据
  const groupBySchool = (items: AlternativeItem[]): SchoolGroup[] => {
    const schoolMap = new Map<string, SchoolGroup>();

    items.forEach((item) => {
      if (!schoolMap.has(item.schoolCode)) {
        schoolMap.set(item.schoolCode, {
          schoolCode: item.schoolCode,
          schoolName: item.schoolName,
          majors: [],
          isExpanded: false,
        });
      }
      schoolMap.get(item.schoolCode)!.majors.push(item);
    });

    return Array.from(schoolMap.values());
  };

  // 智能省份搜索函数
  const isProvinceMatch = (searchText: string, provinceName: string): boolean => {
    if (!searchText || !provinceName) return false;

    const searchLower = searchText.toLowerCase();
    const provinceLower = provinceName.toLowerCase();

    // 直接匹配
    if (provinceLower.includes(searchLower) || searchLower.includes(provinceLower)) {
      return true;
    }

    // 处理带"省"字的搜索
    if (searchLower.endsWith('省')) {
      const searchWithoutProvince = searchLower.slice(0, -1); // 去掉"省"字
      return provinceLower.includes(searchWithoutProvince);
    }

    // 处理带"市"字的搜索
    if (searchLower.endsWith('市')) {
      const searchWithoutCity = searchLower.slice(0, -1); // 去掉"市"字
      return provinceLower.includes(searchWithoutCity);
    }

    return false;
  };

  // 加载智能推荐数据
  const loadSmartRecommendData = useCallback(async () => {
    if (activeTab === 'smart' && smartRecommendData.length === 0) {
      try {
        setSmartRecommendLoading(true);
        const response = await nominate();

        if (response && response.code === 200) {
          // 处理智能推荐数据
          // 根据实际API返回的数据结构访问数据
          const nominateData = (response as any).data.targetGroup || [];

          // 检查segmentStats数据结构
          const segmentStatsData = (response as any).data?.segmentStats || [];

          // 保存segmentStats数据到状态，供位次段筛选使用
          setSegmentStats(segmentStatsData);

          // 转换数据格式 - 使用通用转换函数
          const convertedData: AlternativeGroup[] = nominateData.map((item: any) =>
            convertToAlternativeGroup(item)
          );

          setSmartRecommendData(convertedData);

          // 更新推荐数量
          const recommendCount =
            (response as any).data?.recommendCount ||
            (response as any).data?.targetGroup?.count ||
            0;
          if (recommendCount !== undefined) {
            dispatch(setRecommendCount(recommendCount));
          }
        }
      } catch (error) {
        console.error('加载智能推荐数据失败:', error);
        message.error('加载智能推荐数据失败');
      } finally {
        setSmartRecommendLoading(false);
      }
    }
  }, [activeTab, smartRecommendData.length, dispatch]);

  // 构建位次段筛选选项
  const buildRankSegmentOptions = useCallback(() => {
    // 构建位次段选项
    const options: { id: string; label: string; count: number }[] = [];

    // 根据当前tab选择数据源
    if (activeTab === 'smart') {
      // 智能推荐tab：优先使用segmentStats数据，如果没有则从智能推荐数据中统计
      if (segmentStats && segmentStats.length > 0) {
        // 使用segmentStats数据构建选项，显示所有位次段（包括没有数据的）
        segmentStats.forEach((stat) => {
          options.push({
            id: stat.groupId,
            label: stat.name,
            count: stat.count,
          });
        });
      } else {
        // 如果没有segmentStats数据，从智能推荐数据中统计位次段
        const smartSegmentStats = new Map<number, number>();
        smartRecommendData.forEach((group) => {
          const groupId = parseInt(group.groupId) || 0;
          smartSegmentStats.set(groupId, (smartSegmentStats.get(groupId) || 0) + group.count);
        });

        // 转换为筛选选项
        smartSegmentStats.forEach((count, groupId) => {
          if (count > 0) {
            const groupName = getGroupName(groupId);
            options.push({
              id: groupId.toString(),
              label: groupName,
              count: count,
            });
          }
        });
      }
    } else {
      // 全部可选tab：优先使用segmentStats数据，如果没有则从alternatives数据中统计
      if (segmentStats && segmentStats.length > 0) {
        segmentStats.forEach((stat) => {
          options.push({
            id: stat.groupId,
            label: stat.name,
            count: stat.count,
          });
        });
      } else if (alternatives && alternatives.length > 0) {
        // 从alternatives数据中统计位次段
        const alternativesSegmentStats = new Map<number, number>();
        alternatives.forEach((group) => {
          if (group.result && group.result.length > 0) {
            group.result.forEach((item: AlternativeItem) => {
              const groupId = item.group || 0;
              alternativesSegmentStats.set(
                groupId,
                (alternativesSegmentStats.get(groupId) || 0) + 1
              );
            });
          }
        });

        // 转换为筛选选项
        alternativesSegmentStats.forEach((count, groupId) => {
          if (count > 0) {
            const groupName = getGroupName(groupId);
            options.push({
              id: groupId.toString(),
              label: groupName,
              count: count,
            });
          }
        });
      }
    }

    return options;
  }, [activeTab, smartRecommendData, segmentStats, alternatives]);

  // 获取位次段名称的辅助函数
  const getGroupName = (groupId: number): string => {
    // 直接从 segmentStats 中查找对应的名称
    const stat = segmentStats.find((stat) => stat.groupId === groupId.toString());
    if (stat) {
      return stat.name;
    }
    // 如果找不到，返回默认名称
    return `位次段${groupId}`;
  };

  // 监听tab切换，加载智能推荐数据
  useEffect(() => {
    if (activeTab === 'smart') {
      loadSmartRecommendData();
    }
  }, [activeTab, loadSmartRecommendData]);

  // 搜索过滤逻辑
  const filterDataBySearch = useCallback(
    (data: AlternativeItem[]) => {
      const filteredData = data.filter((item) => {
        // 搜索文本过滤
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          searchText === '' ||
          item.schoolName.toLowerCase().includes(searchLower) ||
          item.name.toLowerCase().includes(searchLower) ||
          item.majorCode.toLowerCase().includes(searchLower) ||
          getCityDisplayInfo(item).toLowerCase().includes(searchLower) ||
          (item.provinceName && isProvinceMatch(searchText, item.provinceName));

        // 学校性质过滤
        const matchesNature =
          selectedSchoolNature === 'all' || item.schoolNature === selectedSchoolNature;

        // 位次段过滤
        const matchesRankSegment =
          selectedRankSegment === 'all' ||
          item.group?.toString() === selectedRankSegment ||
          // 兼容字符串类型的groupId
          (typeof item.group === 'string' && item.group === selectedRankSegment) ||
          // 兼容数字类型的groupId
          (typeof item.group === 'number' && item.group.toString() === selectedRankSegment);

        return matchesSearch && matchesNature && matchesRankSegment;
      });

      return filteredData;
    },
    [searchText, selectedSchoolNature, selectedRankSegment]
  );

  // 根据当前Tab过滤数据
  const getFilteredData = useCallback(() => {
    // 根据当前选中的tab页过滤数据
    if (activeTab === 'smart') {
      // 智能推荐tab：显示智能推荐的数据
      if (smartRecommendData.length === 0) {
        return [];
      }

      // 应用搜索过滤到智能推荐数据
      // 将 AlternativeGroup[] 转换为 AlternativeItem[] 用于过滤
      const allSmartItems: AlternativeItem[] = smartRecommendData.flatMap((group) => group.data);
      const filteredSmartItems = filterDataBySearch(allSmartItems);

      // 将过滤后的数据重新按位次段分组，并保留 count 信息
      const smartGroupedData: GroupedAlternatives[] = [];

      // 从原始 smartRecommendData 中获取每个分组的 count 信息
      smartRecommendData.forEach((groupData) => {
        const groupId = groupData.groupId;
        const groupItems = filteredSmartItems.filter((item) => item.group?.toString() === groupId);

        if (groupItems.length > 0) {
          smartGroupedData.push({
            group: parseInt(groupId) || groupId,
            result: groupItems,
            count: groupItems.length, // 使用过滤后的实际数量
          });
        }
      });

      // 对分组进行排序：根据segmentStats中的groupId顺序进行排序
      // 如果segmentStats有数据，按照其顺序排序；否则使用默认排序
      if (segmentStats && segmentStats.length > 0) {
        // 创建groupId到索引的映射
        const groupOrderMap = new Map<string, number>();
        segmentStats.forEach((stat: any, index: number) => {
          groupOrderMap.set(stat.groupId, index);
        });

        return smartGroupedData.sort((a, b) => {
          const aOrder = groupOrderMap.get(a.group?.toString() || '') ?? 999;
          const bOrder = groupOrderMap.get(b.group?.toString() || '') ?? 999;
          return aOrder - bOrder;
        });
      } else {
        // 默认排序：2 -> 3 -> 1 -> 0
        return smartGroupedData.sort((a, b) => {
          const orderMap: { [key: string]: number } = { '2': 0, '3': 1, '1': 2, '0': 3 };
          const aOrder = orderMap[a.group?.toString() || ''] ?? 999;
          const bOrder = orderMap[b.group?.toString() || ''] ?? 999;
          return aOrder - bOrder;
        });
      }
    } else {
      // 全部可选tab：显示所有志愿（包括未入选的）
      // 直接使用原始数据，不进行排序
      const sortedData = alternatives;

      // 应用搜索过滤
      const filteredData = sortedData
        .map((group: GroupedAlternatives) => ({
          ...group,
          result: filterDataBySearch(group.result),
        }))
        .filter((group: GroupedAlternatives) => group.result.length > 0);

      return filteredData;
    }

    // 默认返回空数组，避免undefined错误
    return [];
  }, [alternatives, filterDataBySearch, activeTab, smartRecommendData]);

  // 优化的数据加载函数
  const loadSuitabilityData = useCallback(
    async (groupId?: string) => {
      // 添加基本的缓存检查，防止重复加载
      const currentGroupId = groupId || 'all';
      if (hasInitialized && lastLoadedGroupId === currentGroupId) {
        return true;
      }

      try {
        dispatch(setLoading(true));

        // 调用 getSuitability API 获取数据
        const apiGroupId = groupId ? Number(groupId) : undefined;
        const suitabilityResponse = await getSuitability(apiGroupId);

        if (suitabilityResponse && suitabilityResponse.code === 200) {
          // 服务器返回的数据结构是 { segmentStats, targetGroup, data, count }
          const suitabilityData = suitabilityResponse.data.targetGroup;
          const suitabilitySegmentStats = suitabilityResponse.data.segmentStats || [];

          // 从API响应中获取推荐志愿数量
          const apiRecommendCount = suitabilityResponse.data.targetGroup.count;
          if (apiRecommendCount !== undefined) {
            dispatch(setRecommendCount(apiRecommendCount));
          }

          // 将 API 返回的数据转换为我们的类型
          const convertedData: AlternativeGroup[] = [convertToAlternativeGroup(suitabilityData)];

          // 按位次段分组
          const groupByCategory = (
            arr: AlternativeItem[],
            key: keyof AlternativeItem
          ): GroupedAlternatives[] => {
            const groupedMap = arr.reduce(
              (map: Map<any, AlternativeItem[]>, item: AlternativeItem) => {
                const groupValue = item[key];
                if (!map.has(groupValue)) {
                  map.set(groupValue, []);
                }
                map.get(groupValue)!.push(item);
                return map;
              },
              new Map()
            );

            return Array.from(groupedMap).map(([category, result]) => ({
              group: category,
              result,
            }));
          };

          // 将 AlternativeGroup[] 转换为 AlternativeItem[] 用于分组
          const allItems: AlternativeItem[] = convertedData.flatMap((group) => group.data);
          const alternativesGroup = groupByCategory(allItems, 'group');

          // 对分组进行排序：根据segmentStats中的groupId顺序进行排序
          let sortedAlternativesGroup;
          if (suitabilitySegmentStats && suitabilitySegmentStats.length > 0) {
            const groupOrderMap = new Map<string, number>();
            suitabilitySegmentStats.forEach((stat: any, index: number) => {
              groupOrderMap.set(stat.groupId, index);
            });

            sortedAlternativesGroup = alternativesGroup.sort((a, b) => {
              const aOrder = groupOrderMap.get(a.group?.toString() || '') ?? 999;
              const bOrder = groupOrderMap.get(b.group?.toString() || '') ?? 999;
              return aOrder - bOrder;
            });
          } else {
            // 默认排序：2 -> 3 -> 1 -> 0
            sortedAlternativesGroup = alternativesGroup.sort((a, b) => {
              const orderMap: { [key: string]: number } = { '2': 0, '3': 1, '1': 2, '0': 3 };
              const aOrder = orderMap[a.group?.toString() || ''] ?? 999;
              const bOrder = orderMap[b.group?.toString() || ''] ?? 999;
              return aOrder - bOrder;
            });
          }

          // 保存原始顺序数据
          const originalOrderData = [
            {
              group: -999,
              result: allItems,
            },
          ];

          // 更新Redux状态
          const finalData = groupId
            ? [
                {
                  group: Number(groupId),
                  result: allItems,
                },
              ]
            : sortedAlternativesGroup;

          dispatch(setAlternatives(finalData));

          localStorage.setItem('aiVolunteerOriginalData', JSON.stringify(originalOrderData));

          // 更新segmentStats数据，供位次段筛选使用
          setSegmentStats(suitabilitySegmentStats);

          // 更新缓存状态
          setLastLoadedGroupId(groupId || 'all');

          return true;
        }
        return false;
      } catch (error) {
        console.error('加载志愿数据失败:', error);
        message.error('加载志愿数据失败');
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, hasInitialized, lastLoadedGroupId]
  );

  // 定位到特定分组的函数 - 用于智能推荐tab的位次段筛选
  const scrollToSpecificGroup = useCallback(
    (groupId: string) => {
      // 根据当前tab选择数据源
      const currentData = activeTab === 'smart' ? smartRecommendData : alternatives;

      // 查找对应分组的位置
      const targetGroup = currentData.find((group) => group.group?.toString() === groupId);

      if (targetGroup) {
        // 计算分组在页面中的位置
        let groupPosition = 0;
        let found = false;

        for (const group of currentData) {
          if (group.group?.toString() === groupId) {
            found = true;
            break;
          }
          // 估算每个分组的高度（包括标题栏和内容）
          const groupHeight = 100 + (group.result?.length || 0) * 200;
          groupPosition += groupHeight;
        }

        if (found) {
          // 滚动到对应位置
          setTimeout(() => {
            window.scrollTo({
              top: groupPosition,
              behavior: 'smooth',
            });
          }, 100);
        }
      }
    },
    [activeTab, smartRecommendData, alternatives]
  );

  // 位次段选择回调函数 - 根据当前tab选择不同的处理逻辑
  const handleRankSegmentChange = useCallback(
    async (groupId: string) => {
      // 添加基本的防抖检查，防止无限循环
      if (loading) {
        return;
      }

      // 更新本地状态
      setSelectedRankSegment(groupId);

      if (activeTab === 'smart') {
        // 智能推荐tab：直接定位到对应分组位置，不请求API
        if (groupId === 'all') {
          // 选择全部时，滚动到顶部
          window.scrollTo(0, 0);
        } else {
          // 定位到特定分组
          scrollToSpecificGroup(groupId);
        }
      } else {
        // 全部可选tab：需要请求API加载数据
        // 检查是否需要重新加载数据
        if (groupId === selectedRankSegment && alternatives.length > 0) {
          const currentGroupData = alternatives.find(
            (group) => group.group?.toString() === groupId
          );
          if (currentGroupData && currentGroupData.result.length > 0) {
            return;
          }
        }

        try {
          setLastLoadedGroupId(groupId); // 设置缓存，防止重复调用
          // 根据选中的位次段加载数据
          await loadSuitabilityData(groupId === 'all' ? undefined : groupId);
        } catch (error) {
          console.error('位次段选择数据更新失败:', error);
        }
      }
    },
    [
      loadSuitabilityData,
      loading,
      selectedRankSegment,
      activeTab,
      alternatives,
      scrollToSpecificGroup,
    ]
  );

  // 获取已备选志愿状态的函数 - 增强错误处理和状态管理
  const loadAlternativeStatus = useCallback(async () => {
    try {
      const alternativesResponse = await getMajorAlternatives();

      if (alternativesResponse && alternativesResponse.code === 200) {
        const alternatives = alternativesResponse.data?.alternatives || [];

        const alternativeMap: { [key: string]: { isAlternative: boolean; id?: string } } = {};

        // 构建已备选学校的映射
        alternatives.forEach((item: any) => {
          const schoolKey = `${item.schoolCode}_${item.majorCode}`;
          alternativeMap[schoolKey] = { isAlternative: true, id: item.id };
        });

        dispatch(setAlternativeStatus(alternativeMap));
        return true;
      } else {
        console.warn('备选状态API返回异常:', alternativesResponse);
        return false;
      }
    } catch (error) {
      console.error('获取备选状态失败:', error);
      // 不显示错误提示，避免影响用户体验
      return false;
    }
  }, [dispatch]);

  // 优化的页面初始化逻辑
  useEffect(() => {
    const initializePage = async () => {
      // 防止重复初始化
      if (isInitializing || hasInitialized) {
        return;
      }

      try {
        setIsInitializing(true);
        dispatch(setLoading(true));

        // 设置页面标识
        dispatch(setPageKey(pageKeyRef.current));

        // 检查是否是从返回操作进入的页面
        const isBackNavigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        const isReturningFromBack = isBackNavigation?.type === 'back_forward';

        if (isReturningFromBack) {
          dispatch(setIsReturning(true));
        }

        // 加载初始数据
        const success = await loadSuitabilityData();

        if (success) {
          // 确保数据加载完成后再加载备选状态
          // 添加小延迟确保Redux状态已更新
          setTimeout(async () => {
            await loadAlternativeStatus();
          }, 100);

          // 设置高发展潜能专业数量
          const topDevelopmentCount = 0;
          localStorage.setItem('topDevelopmentCount', topDevelopmentCount.toString());
        }
      } catch (error) {
        console.error('页面初始化失败:', error);
        message.error('页面初始化失败');
      } finally {
        dispatch(setLoading(false));
        dispatch(setHasInitialized(true));
        setIsInitializing(false);
      }
    };

    initializePage();
  }, [dispatch, isInitializing, hasInitialized]);

  // 渲染空状态提示 - 根据tab页状态显示不同内容
  const renderEmptyState = () => {
    // 根据当前选中的tab页显示不同的空状态提示
    if (activeTab === 'smart') {
      return (
        <div className="w-full max-w-xl bg-white rounded-2xl p-6 text-center">
          <div className="mb-4">
            <div className="text-gray-400 text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">暂无智能推荐</h3>
            <p className="text-gray-500 text-sm mb-6">
              当前没有符合您条件的智能推荐志愿，请尝试调整搜索条件或切换到&quot;全部可选&quot;查看所有志愿。
            </p>
            <button
              onClick={() => dispatch(setActiveTab('all'))}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              查看全部志愿
            </button>
          </div>
        </div>
      );
    }

    // 默认显示全部可选的空状态
    return (
      <div className="w-full max-w-xl bg-white rounded-2xl p-6 text-center">
        <div className="mb-4">
          <div className="text-gray-400 text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">暂无可选志愿</h3>
          <p className="text-gray-500 text-sm mb-6">
            您还没有任何可选志愿，快去录入您的个人信息吧！
          </p>
          <button
            onClick={() => handleNavigation('/basicInfo')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            录入个人信息
          </button>
        </div>
      </div>
    );
  };

  // 处理备选按钮点击
  const handleAlternativeClick = async (item: AlternativeItem) => {
    const itemKey = `${item.schoolCode}_${item.majorCode}`;
    const currentStatus = alternativeStatus[itemKey];

    // 如果正在加载中，直接返回
    if (loadingStatus[itemKey]) {
      return;
    }

    try {
      // 设置加载状态
      dispatch(updateLoadingStatus({ key: itemKey, loading: true }));

      if (currentStatus?.isAlternative && currentStatus.id) {
        // 如果已经备选，则取消备选
        const response = await cancelAlternative(currentStatus.id);

        if (response && response.code === 200) {
          // 更新备选状态
          dispatch(
            updateAlternativeStatus({
              key: itemKey,
              status: { isAlternative: false, id: undefined },
            })
          );
          // 备选删除成功提示
          message.success('取消备选成功，已成功从志愿频道的备选志愿列表中移除。');
        } else {
          message.error(response?.message || '取消备选志愿失败');
        }
      } else {
        // 如果未备选，则添加备选
        // 准备历史分数数据
        const historyScoreData = (() => {
          // 兼容不同的数据结构
          const historyScores = Array.isArray(item.historyScore)
            ? item.historyScore
            : [item.historyScore];

          return historyScores
            .filter((score) => score && typeof score === 'object')
            .map((scoreItem: any) => {
              // 处理嵌套的historyScore结构
              const scoreData = scoreItem.historyScore || scoreItem.scoreData || scoreItem;
              const result: { [key: string]: string } = {};

              if (scoreData && typeof scoreData === 'object') {
                for (const [key, value] of Object.entries(scoreData)) {
                  if (typeof value === 'string') {
                    result[key] = value;
                  }
                }
              }

              return result;
            })
            .filter((data) => Object.keys(data).length > 0);
        })();

        // 调用创建备选志愿接口
        const response = await createMajorAlternative({
          majorCode: item.majorCode,
          majorName: item.name,
          schoolCode: item.schoolCode,
          schoolName: item.schoolName,
          schoolFeature: item.schoolFeature || '',
          historyScore: historyScoreData,
          group: (item.group || 0).toString(),
        });

        if (response && response.code === 200) {
          // 更新备选状态
          dispatch(
            updateAlternativeStatus({
              key: itemKey,
              status: {
                isAlternative: true,
                id: response.data?.id,
              },
            })
          );
          // 备选成功提示
          message.success('备选成功，已成功加入志愿频道的备选志愿列表。');
        } else {
          message.error(response?.message || '添加备选志愿失败');
        }
      }
    } catch (error) {
      console.error('备选志愿操作失败:', item);
      message.error('备选志愿操作失败');
    } finally {
      // 清除加载状态
      dispatch(updateLoadingStatus({ key: itemKey, loading: false }));
    }
  };

  // 通用的专业组查看函数
  const handleViewMajorGroup = async (item: AlternativeItem) => {
    if (item?.majorGroupId) {
      try {
        setCurrentMajorGroupInfo({
          majorGroupId: item.majorGroupId,
          majorGroupName: item.majorGroupName || '',
          schoolName: item.schoolName,
        });

        // 调用专业组API
        const response = await getMajorGroup(item.majorGroupId);

        if (response && response.code === 200) {
          setMajorGroupData(response.data || []);
          setShowMajorGroupDialog(true);
        } else {
          message.error(response?.message || '获取专业组信息失败');
        }
      } catch (error) {
        console.error('获取专业组信息失败:', error);
        message.error('获取专业组信息失败');
      }
    }
  };

  // 关闭专业组弹窗
  const handleCloseMajorGroupDialog = () => {
    setShowMajorGroupDialog(false);
    setMajorGroupData([]);
    setCurrentMajorGroupInfo(null);
  };

  // 处理发展潜能点击事件
  const handleDevelopmentPotentialClick = () => {
    setShowDevelopmentPotentialDialog(true);
  };

  // 关闭发展潜能对话框
  const handleCloseDevelopmentPotentialDialog = () => {
    setShowDevelopmentPotentialDialog(false);
  };
  // 监听位次段数据变化，自动选择默认位次段
  useEffect(() => {
    // 当位次段数据变化且当前没有选择任何位次段时，自动选择默认的"+30%到+100%位次段"
    if (
      selectedRankSegment === '' &&
      !loading &&
      (segmentStats.length > 0 || alternatives.length > 0)
    ) {
      const options = buildRankSegmentOptions();
      if (options.length > 0) {
        // 查找"+30%到+100%位次段"，如果找不到则选择第一个
        const targetSegment = options.find(
          (option) =>
            option.label.includes('+30%到+100%') ||
            option.label.includes('+30%') ||
            option.id === '3' // 通常位次段3对应+30%到+100%
        );
        const defaultRankSegment = targetSegment ? targetSegment.id : options[0].id;
        setSelectedRankSegment(defaultRankSegment);
        // 自动加载默认位次段的数据
        handleRankSegmentChange(defaultRankSegment);
      }
    }
  }, [
    segmentStats,
    smartRecommendData,
    alternatives,
    activeTab,
    loading,
    buildRankSegmentOptions,
    handleRankSegmentChange,
  ]);

  // 解析学校特色标签的函数
  const parseSchoolFeatures = (features: string | null | undefined): string[] => {
    if (!features) return [];

    // 按逗号分隔并去除空白字符
    return features
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  // 获取城市显示信息的辅助函数
  const getCityDisplayInfo = (item: AlternativeItem): string => {
    // 优先使用 provinceName 和 cityName
    if (item.provinceName && item.cityName) {
      return `${item.provinceName} ${item.cityName}`;
    }
    if (item.provinceName) {
      return item.provinceName;
    }
    if (item.cityName) {
      return item.cityName;
    }
    // 如果都没有，使用 schoolCity
    if (item.schoolCity) {
      return item.schoolCity;
    }
    // 最后才显示未知城市
    return '城市信息待补充';
  };

  const getHistoryScore = (historyScore: any) => {
    let htmlTemp = '';

    // 兼容不同的数据结构
    const historyScores = Array.isArray(historyScore) ? historyScore : [historyScore];

    if (historyScores && historyScores.length > 0) {
      historyScores?.map((item: any, index: number) => {
        // 添加分隔线和备注信息（包括第一个）
        if (index > 0) {
          htmlTemp += `<div class="border-t border-gray-200 my-4"></div>`;
        }

        // 显示备注信息（兼容不同的字段名）
        const remark = item.remark || item.remarkInfo || item.note || '';
        if (remark) {
          htmlTemp += `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div class="flex items-start">
                <span class="text-yellow-600 mr-2 mt-0.5">📝</span>
                <div class="text-sm text-yellow-800">
                  <span class="font-medium">备注：</span>
                  ${remark}
                </div>
              </div>
            </div>
          `;
        }

        // 历史分数表格
        const scoreData = item.historyScore || item.scoreData || item;
        if (
          scoreData &&
          (Array.isArray(scoreData) ? scoreData.length > 0 : Object.keys(scoreData).length > 0)
        ) {
          htmlTemp += `
            <div class="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div class="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <h4 class="text-sm font-semibold text-blue-800 flex items-center">
                  <span class="mr-2">📊</span>
                  历年录取分数&nbsp;&nbsp;${item.batch ? item.batch : ''}&nbsp;&nbsp;${item.tuition > 0 ? item.tuition + '元/学年' : ''}
                </h4>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">年份</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">最低分</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">最低位次</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">录取</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
          `;

          // 处理不同的数据结构
          const scoreEntries = Array.isArray(scoreData) ? scoreData : [scoreData];
          scoreEntries?.forEach((hs: any) => {
            if (hs && typeof hs === 'object') {
              for (const [key, value] of Object.entries(hs)) {
                if (typeof value === 'string') {
                  const valueTemp = value.split(',');
                  const score = valueTemp && valueTemp.length > 2 ? valueTemp[0] : '';
                  const rank = valueTemp && valueTemp.length > 2 ? valueTemp[1] : '';
                  const count = valueTemp && valueTemp.length > 2 ? valueTemp[2] : '';

                  htmlTemp += `
                    <tr class="hover:bg-gray-50 transition-colors duration-150">
                      <td class="px-4 py-3 text-sm font-medium text-gray-900">${key}</td>
                      <td class="px-4 py-3 text-sm text-gray-700">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ${score}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-700">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ${rank}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-700">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          ${count}名
                        </span>
                      </td>
                    </tr>
                  `;
                }
              }
            }
          });

          htmlTemp += `
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }
      });
    }
    return htmlTemp;
  };

  // 获取当前显示的数据
  const filteredData = getFilteredData();

  // 计算总项目数
  const totalItems = filteredData.reduce(
    (total: number, group: GroupedAlternatives) => total + (group.result?.length || 0),
    0
  );

  // 计算当前应该显示的分组数量
  const getDisplayedGroups = () => {
    let totalItems = 0;
    const displayedGroups: GroupedAlternatives[] = [];

    for (const group of filteredData) {
      if (totalItems >= displayCount) break;

      const groupItems = group.result || [];
      if (totalItems + groupItems.length <= displayCount) {
        // 整个分组都可以显示
        displayedGroups.push(group);
        totalItems += groupItems.length;
      } else {
        // 只显示分组的一部分
        const remainingItems = displayCount - totalItems;
        displayedGroups.push({
          ...group,
          result: groupItems.slice(0, remainingItems),
        });
        break;
      }
    }

    return displayedGroups;
  };

  const displayedGroups = getDisplayedGroups();

  // 获取位次差DOM
  const getRankdiffDom = (item: any) => {
    // 如果位次差为0或不存在，则不显示
    if (!item.Rankdiff || item.Rankdiff === 0) {
      return null;
    }

    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold">
        上年较您
        <span
          className={item.Rankdiff > 0 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}
        >
          {item.Rankdiff > 0
            ? `高${item.Rankdiff}位次/${Math.floor(item.RankdiffPer || 0)}%`
            : `低${Math.abs(item.Rankdiff)}位次/${Math.floor(item.RankdiffPer || 0)}%`}
        </span>
      </span>
    );
  };

  const scaleAnswerCount = localStorage.getItem('scaleAnswerCount');

  if (scaleAnswerCount && Number(scaleAnswerCount) !== 168) {
    return (
      <>
        <StartWelcomePage />
        <BottomNav selectedIndex={0} />
      </>
    );
  }

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 50 }}>
      <div className="top-container">
        {/* 顶部导航条 */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="flex items-center justify-between px-4 py-3">
            {/* 返回按钮 */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* 标签页 - 居中显示 */}
            <div className="flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
              <button
                className={`text-base font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => dispatch(setActiveTab('all'))}
              >
                全部可选
              </button>
              <button
                className={`text-sm font-medium transition-colors ${
                  activeTab === 'smart'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => dispatch(setActiveTab('smart'))}
              >
                智能推荐
              </button>
            </div>
            <div className="flex items-right ">
              <button
                className="text-base font-medium text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => {
                  // 重启自评逻辑
                  localStorage.removeItem('scaleAnswerCount');
                  window.location.href = '/selfassessment';
                }}
              >
                {userInfo?.scaleAnswerCount === 168 ? '重启自评' : '开始自评'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3">
        {/* 搜索组件 */}
        <div className="w-full max-w-xl bg-white rounded-2xl p-4 mb-3">
          <div className="space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Input
                placeholder="搜索学校名称、专业名称、城市、省份等..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined className="text-gray-400" />}
                suffix={
                  <InfoCircleOutlined
                    className="text-blue-500 cursor-pointer"
                    onClick={() => setShowSearchTips(!showSearchTips)}
                    title="搜索帮助"
                  />
                }
                className="rounded-lg"
                allowClear
              />
              {/* 搜索提示 */}
              {showSearchTips && (
                <div className="search-tips-container absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-10">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      💡 <strong>搜索提示：</strong>
                    </div>
                    <div>• 可以搜索学校名称（如：清华大学）</div>
                    <div>• 可以搜索专业名称（如：计算机科学）</div>
                    <div>• 可以搜索专业代码（如：080901）</div>
                    <div>• 可以搜索城市名称（如：北京、上海）</div>
                    <div>• 可以搜索省份名称（如：江苏、浙江、湖南省）</div>
                    <div>• 支持模糊搜索，输入部分关键词即可</div>
                  </div>
                </div>
              )}
            </div>

            {/* 学校性质标签 */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">学校性质：</span>
              <Tag
                color={selectedSchoolNature === 'all' ? 'blue' : 'default'}
                className="cursor-pointer"
                onClick={() => setSelectedSchoolNature('all')}
              >
                全部
              </Tag>
              <Tag
                color={selectedSchoolNature === 'public' ? 'green' : 'default'}
                className="cursor-pointer"
                onClick={() => setSelectedSchoolNature('public')}
              >
                公办
              </Tag>
              <Tag
                color={selectedSchoolNature === 'private' ? 'orange' : 'default'}
                className="cursor-pointer"
                onClick={() => setSelectedSchoolNature('private')}
              >
                民办
              </Tag>
            </div>

            {/* 位次段筛选 */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">位次段：</span>
              <CommonSelect
                data={buildRankSegmentOptions()}
                placeholder={activeTab === 'smart' ? '选择位次段快速定位' : '选择位次段'}
                onSelect={(value) => handleRankSegmentChange(value)}
                onClear={() => handleRankSegmentChange('all')}
                defaultValue={selectedRankSegment}
                width="200px"
                showCount={true}
              />
              {/* 根据当前tab显示不同的提示 */}
              {activeTab === 'smart' && (
                <div className="w-full mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                  💡 智能推荐志愿，基于六大条件层层筛选：
                  <br />
                  1.更安全：-100%位次差＜所有志愿＜+100%位次差
                  <br />
                  2.更长远：上述位次段发展潜能前20%专业
                  {userInfo?.scaleAnswerCount !== 168 && (
                    <button
                      onClick={() => {
                        handleCloseDevelopmentPotentialDialog();
                        window.location.href = '/selfassessment';
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      开启自评
                    </button>
                  )}
                  <br />
                  3.更开心：上述专业开心体验分值＞0
                  {userInfo?.scaleAnswerCount !== 168 && (
                    <button
                      onClick={() => {
                        handleCloseDevelopmentPotentialDialog();
                        window.location.href = '/selfassessment';
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      开启自评
                    </button>
                  )}{' '}
                  <br />
                  4.学风好：遴选其中升学率前50%院校
                  <br />
                  5.专业强：再选保研率前50%院校
                  <br />
                  6.风险低：已去除含发展潜能后20%专业的选项，大幅降低调剂后厌学风险
                  <br />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 搜索结果统计 */}
        {(searchText || selectedSchoolNature !== 'all' || selectedRankSegment !== 'all') && (
          <div className="w-full max-w-xl bg-blue-50 rounded-2xl p-3 mb-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-medium">搜索结果：</span>
                <span className="text-blue-800">
                  找到 {totalItems} 个志愿
                  {activeTab === 'smart' && <span className="text-blue-600 ml-2">(智能推荐)</span>}
                  {activeTab === 'all' && <span className="text-blue-600 ml-2">(全部可选)</span>}
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchText('');
                  setSelectedSchoolNature('all');
                  setSelectedRankSegment('all');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                清除筛选
              </button>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {(loading || (activeTab === 'smart' && smartRecommendLoading)) && (
          <div className="w-full max-w-xl bg-white rounded-2xl mt-3 p-6 text-center">
            <div className="text-gray-500">加载中...</div>
          </div>
        )}

        {/* 备选志愿列表 */}
        {!loading && !(activeTab === 'smart' && smartRecommendLoading) && (
          <>
            {/* 空状态提示 */}
            {filteredData.length === 0 && renderEmptyState()}

            {/* 备选志愿列表 - 使用虚拟滚动优化 */}
            {filteredData.length > 0 && (
              <div
                ref={scrollManager.scrollContainerRef}
                className="w-full max-w-xl xunigundong"
                style={{
                  overflowX: 'hidden',
                  position: 'relative',
                }}
              >
                {displayedGroups.map((group) => {
                  // 按位次段分组的数据
                  const schoolGroups = groupBySchool(group.result);

                  // 获取位次段名称
                  const getGroupDisplayName = (groupId: number | string) => {
                    if (segmentStats && segmentStats.length > 0) {
                      const stat = segmentStats.find((s) => s.groupId === groupId.toString());
                      return stat ? stat.name : `位次段${groupId}`;
                    }
                    return `位次段${groupId}`;
                  };

                  return (
                    <div
                      key={group.group + 'group'}
                      className="w-full max-w-xl bg-white rounded-2xl mt-3 overflow-hidden"
                    >
                      {/* 位次段标题栏 - 仅显示信息，不可点击 */}
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold">
                              {getGroupDisplayName(group.group)}
                            </span>
                            <span className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded-full">
                              {segmentStats?.find((s) => s.groupId === group.group.toString())
                                ?.count || 0}{' '}
                              个志愿
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 位次段内容 */}
                      <div className="p-2">
                        {schoolGroups.map((schoolGroup) => (
                          <div key={schoolGroup.schoolCode} className="mb-4">
                            {/* 学校与基本信息 */}
                            <div
                              className="flex items-center justify-between border-b pb-2 p-2 -mx-4 px-4"
                              style={{ backgroundColor: '#007bff' }}
                              onClick={() => {
                                handleNavigation(
                                  `/major/schooldetail?schoolCode=${schoolGroup.schoolCode}&schoolname=${schoolGroup.schoolName}`
                                );
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-[18px] font-bold text-white">
                                  {schoolGroup.schoolName} {'>'}
                                </span>
                              </div>
                            </div>

                            {/* 专业列表 */}
                            {schoolGroup.majors.map((item: any) => (
                              <div key={item.id}>
                                {/* 专业与热爱能量 */}
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center">
                                    <span
                                      className={`text-blue-700 text-[14px] mr-2 ${item.name.length > 8 ? 'cursor-pointer hover:text-blue-800' : ''}`}
                                      onClick={() => {
                                        handleNavigation(
                                          `/major/majorlovedetail?majorCode=${item.majorCode}&&majorName=${item.name}&score=${item.score}&isFavorite=true`,
                                          { replace: false } // 不使用 replace，保持正常的导航历史
                                        );
                                      }}
                                    >
                                      {item.majorCode}{' '}
                                      {item.name.length > 5
                                        ? item.name.substring(0, 5) + '...'
                                        : item.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {/* 显示较上年变化 */}
                                    {getRankdiffDom(item)}

                                    <button
                                      className={`px-3 py-1 rounded ${(() => {
                                        const itemKey = `${item.schoolCode}_${item.majorCode}`;
                                        const isAlternative =
                                          alternativeStatus[itemKey]?.isAlternative || false;
                                        const isLoading = loadingStatus[itemKey];
                                        return isAlternative
                                          ? 'bg-red-500 text-white hover:bg-red-600'
                                          : isLoading
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-500 text-white hover:bg-green-600';
                                      })()}`}
                                      onClick={() => handleAlternativeClick(item)}
                                      disabled={(() => {
                                        const itemKey = `${item.schoolCode}_${item.majorCode}`;
                                        return loadingStatus[itemKey];
                                      })()}
                                    >
                                      {(() => {
                                        const itemKey = `${item.schoolCode}_${item.majorCode}`;
                                        const isAlternative =
                                          alternativeStatus[itemKey]?.isAlternative || false;
                                        const isLoading = loadingStatus[itemKey];
                                        return isLoading
                                          ? '处理中...'
                                          : isAlternative
                                            ? '移除'
                                            : '备选';
                                      })()}
                                    </button>
                                  </div>
                                </div>

                                {/* 学校标签行 */}
                                <div className="flex flex-wrap gap-2 mb-3 mt-2">
                                  {/* 学校特色标签 */}
                                  {parseSchoolFeatures(item.schoolFeature).map((feature, index) => (
                                    <span
                                      key={`${item.schoolName}-feature-${index}`}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                  <span
                                    key={item.schoolName + '公办'}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  >
                                    {item.schoolNature === 'public' ? '公办' : '民办'}
                                  </span>

                                  {item.developmentPotential > 0 ? (
                                    <span
                                      key={item.schoolName + '发展潜能'}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 cursor-pointer hover:bg-green-200 transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDevelopmentPotentialClick();
                                      }}
                                    >
                                      发展潜能{item.developmentPotential}分
                                    </span>
                                  ) : (
                                    <span
                                      key={item.schoolName + '发展潜能'}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 cursor-pointer hover:bg-green-200 transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDevelopmentPotentialClick();
                                      }}
                                    >
                                      发展潜能 (
                                      <span className="text-blue-600 underline ml-1">开启自评</span>
                                      )
                                    </span>
                                  )}
                                  {item.enrollmentRate && item.enrollmentRate > 0 && (
                                    <span
                                      key={item.schoolName + '升学率'}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                    >
                                      升学率{item.enrollmentRate}%
                                    </span>
                                  )}

                                  {/* 学制标签 */}
                                  {item.studyPeriod && (
                                    <span
                                      key={item.schoolName + '学制'}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                    >
                                      学制{item.studyPeriod}年
                                    </span>
                                  )}
                                  <span
                                    key={item.schoolName + '校区'}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                                  >
                                    {getCityDisplayInfo(item)}
                                  </span>
                                  {item.majorGroupName && (
                                    <button
                                      key={item.schoolName + '专业组'}
                                      onClick={() => handleViewMajorGroup(item)}
                                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500 text-white border-2 border-purple-400 hover:bg-purple-600 hover:border-purple-500 hover:shadow-md transition-all duration-200 cursor-pointer shadow-sm"
                                      title="点击查看专业组详情"
                                    >
                                      <span className="mr-1">📋</span>
                                      {item.majorGroupName}专业组
                                      <span className="ml-1 text-xs">▶</span>
                                    </button>
                                  )}
                                </div>

                                {/* 历年分数表格 */}
                                <div
                                  className=" bg-gray-50 rounded-b-lg"
                                  dangerouslySetInnerHTML={{
                                    __html: getHistoryScore(item?.historyScore || []),
                                  }}
                                ></div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* 加载更多提示 */}
                {isLoadingMore && (
                  <div className="w-full max-w-xl bg-white rounded-2xl mt-3 p-6 text-center">
                    <div className="text-gray-500">加载中...</div>
                  </div>
                )}

                {/* 显示更多按钮 */}
                {!isLoadingMore && displayCount < totalItems && (
                  <div className="w-full max-w-xl bg-white rounded-2xl mt-3 p-6 text-center">
                    <button
                      onClick={() => {
                        setIsLoadingMore(true);
                        setTimeout(() => {
                          dispatch(setDisplayCount(displayCount + 10));
                          setIsLoadingMore(false);
                        }, 500);
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      加载更多 ({totalItems - displayCount} 个剩余)
                    </button>
                    <div className="mt-2 text-sm text-gray-500">
                      提示：滚动到页面底部也会自动加载更多
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 可关闭的透明浮层提示 */}
      {showFloatingTip && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-3">
                <p className="text-sm leading-relaxed">
                  点击
                  <span className="font-bold text-yellow-300 bg-yellow-300/20 px-1 rounded">
                    备选
                  </span>
                  按钮，该院校专业将进入&ldquo;志愿&rdquo;频道，作为&ldquo;备选志愿&rdquo;，供进一步筛选确认。
                </p>
              </div>
              <button
                onClick={handleCloseFloatingTip}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                title="关闭提示"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <BottomNav
        selectedIndex={0}
        onSelect={() => {
          window.location.href = '/educational';
        }}
      />

      {/* 专业组详情弹窗 */}
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentMajorGroupInfo?.schoolName} - {currentMajorGroupInfo?.majorGroupName}
            </h3>
            <p className="text-sm text-gray-600">专业组详情</p>
          </div>
        }
        open={showMajorGroupDialog}
        onCancel={handleCloseMajorGroupDialog}
        footer={null}
        width={800}
        centered
        className="rounded-2xl"
        style={{ top: '20%', zIndex: 10000 }}
      >
        <div className="p-4">
          {majorGroupData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">暂无专业组详情</div>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
              <div style={{ minWidth: '1200px' }}>
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '20%' }}
                      >
                        专业名称
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '12%' }}
                      >
                        专业代码
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '10%' }}
                      >
                        专业类型
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '12%' }}
                      >
                        批次
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '8%' }}
                      >
                        招生人数
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '8%' }}
                      >
                        学制
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '8%' }}
                      >
                        省份
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '12%' }}
                      >
                        学费
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '10%' }}
                      >
                        备注
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {majorGroupData.map((item) => (
                      <tr
                        key={item.majorCode}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td
                          className="px-3 py-3 text-sm font-medium text-gray-900 truncate"
                          title={item.majorName}
                        >
                          {item.majorName}
                        </td>
                        <td
                          className="px-3 py-3 text-sm text-gray-700 truncate"
                          title={item.majorCode}
                        >
                          {item.majorCode}
                        </td>
                        <td
                          className="px-3 py-3 text-sm text-gray-700 truncate"
                          title={item.subjectType}
                        >
                          {item.subjectType}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 truncate" title={item.batch}>
                          {item.batch}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 truncate" title={item.num}>
                          {item.num}
                        </td>
                        <td
                          className="px-3 py-3 text-sm text-gray-700 truncate"
                          title={`${item.studyPeriod}年`}
                        >
                          {item.studyPeriod}年
                        </td>
                        <td
                          className="px-3 py-3 text-sm text-gray-700 truncate"
                          title={item.province}
                        >
                          {item.province}
                        </td>
                        <td
                          className="px-3 py-3 text-sm text-gray-700 truncate"
                          title={item.tuition}
                        >
                          {item.tuition}
                        </td>
                        <td
                          className="px-3 py-3 text-sm text-gray-700 truncate"
                          title={item.remark}
                        >
                          {item.remark}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 发展潜能说明对话框 */}
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">💡 发展潜能说明</h3>
          </div>
        }
        open={showDevelopmentPotentialDialog}
        onCancel={handleCloseDevelopmentPotentialDialog}
        footer={
          <div className="flex justify-center space-x-3">
            {userInfo?.scaleAnswerCount !== 168 && (
              <button
                onClick={() => {
                  handleCloseDevelopmentPotentialDialog();
                  window.location.href = '/selfassessment';
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                开启自评
              </button>
            )}
            <button
              onClick={handleCloseDevelopmentPotentialDialog}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              关闭
            </button>
          </div>
        }
        width={600}
        centered
        className="rounded-2xl"
      >
        <div className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <span className="text-blue-600 mr-3 mt-1 text-lg">🎯</span>
              <div>
                <h4 className="text-lg font-semibold text-blue-900 mb-2">什么是发展潜能？</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  发展潜能：不同喜欢与天赋在面对各专业微观环境时所具有的热爱能量、面对各专业宏观环境时所拥有的发展机遇，所决定的&ldquo;学习过程愉快、效率高、效果好&rdquo;，及&ldquo;工作干得顺、赚得多、前景光明&rdquo;。
                </p>
              </div>
            </div>
          </div>

          {userInfo?.scaleAnswerCount !== 168 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-yellow-600 mr-3 mt-1 text-lg">⚡</span>
                <div>
                  <h4 className="text-lg font-semibold text-yellow-900 mb-2">
                    开启自评获得精准分析
                  </h4>
                  <p className="text-yellow-800 text-sm leading-relaxed">
                    完成168题自评问卷，系统将为您分析每个专业的发展潜能分数，帮助您做出更明智的志愿选择。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AiVolunteerPage;
