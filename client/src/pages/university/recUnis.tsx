import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message, Input, Tag } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  setDisplayCount,
  setSortTab,
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
  selectSortTab,
  selectAlternativeStatus,
  selectLoading,
  selectLoadingStatus,
  selectRecommendCount,
  selectAlternatives,
  selectPageKey,
  selectHasInitialized,
} from '../../store/slices/aiVolunteerSlice';
import { useScrollManager } from '../../hooks/useScrollManager';

import BottomNav from '../comm/bottom';
import StartWelcomePage from '../selfassessment/startWelcome';
import Top from '../comm/top';
import {
  cancelAlternative,
  nominate,
  createMajorAlternative,
  getMajorAlternatives,
  getMajorGroup,
} from '../../config/volunteer';

// 定义备选志愿项的类型（扩展自 API 返回的数据）
interface AlternativeItem {
  id: string;
  majorCode: string;
  majorName: string;
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

// 定义分组后的备选志愿类型
interface GroupedAlternatives {
  group: number;
  result: AlternativeItem[];
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

// 定义按专业分组的类型
interface MajorGroup {
  majorCode: string;
  majorName: string;
  schools: SchoolGroup[];
  rankGroups?: {
    groupIndex: number;
    groupName: string;
    schools: SchoolGroup[];
  }[];
  isExpanded?: boolean; // 是否展开
}

// 定义按专业分组的备选志愿类型
interface MajorGroupedAlternatives {
  majorCode: string;
  majorName: string;
  result: AlternativeItem[];
}

const RecUnisPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 从 Redux 获取状态 - 使用选择器
  const alternatives = useSelector(selectAlternatives);
  const loading = useSelector(selectLoading);
  const loadingStatus = useSelector(selectLoadingStatus);
  const displayCount = useSelector(selectDisplayCount);
  const sortTab = useSelector(selectSortTab);
  const alternativeStatus = useSelector(selectAlternativeStatus);
  const recommendCount = useSelector(selectRecommendCount);
  const hasInitialized = useSelector(selectHasInitialized);
  const currentPageKey = useSelector(selectPageKey);

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
  const [showSearchTips, setShowSearchTips] = useState(false);

  // 添加精确的滚动位置恢复机制
  const [isRestoringScroll, setIsRestoringScroll] = useState(false);

  // 保存用户最后查看的项目ID
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



  // 添加按专业排序加载状态
  const [isLoadingMajorData, setIsLoadingMajorData] = useState(false);

  // 添加专业组详情相关状态
  const [showMajorGroupDialog, setShowMajorGroupDialog] = useState(false);
  const [majorGroupData, setMajorGroupData] = useState<MajorGroupItem[]>([]);
  const [currentMajorGroupInfo, setCurrentMajorGroupInfo] = useState<{
    majorGroupId: string;
    majorGroupName: string;
    schoolName: string;
  } | null>(null);

  const groupNames = [
    '其他位次段院校',
    '（+5%）到（+30%）位次段院校',
    '（-10%）到+（+5%）位次段院校',
    '（-30%） 到 （-10%）位次段院校',
  ];

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

  // 按专业分组数据
  const groupByMajor = (items: AlternativeItem[]): MajorGroupedAlternatives[] => {
    const majorMap = new Map<string, AlternativeItem[]>();

    items.forEach((item) => {
      const majorKey = `${item.majorCode}_${item.majorName}`;
      if (!majorMap.has(majorKey)) {
        majorMap.set(majorKey, []);
      }
      majorMap.get(majorKey)!.push(item);
    });

    return Array.from(majorMap.entries()).map(([majorKey, result]) => {
      const [majorCode, majorName] = majorKey.split('_', 2);
      return {
        majorCode,
        majorName,
        result,
      };
    });
  };

  // 按专业分组并按位次段分组学校
  const groupByMajorAndRank = (items: AlternativeItem[]): MajorGroup[] => {
    const majorGroups = groupByMajor(items);

    return majorGroups.map((majorGroup) => {
      // 按位次段分组学校
      const rankGroups = new Map<number, AlternativeItem[]>();

      majorGroup.result.forEach((item) => {
        const group = item.group || 0;
        if (!rankGroups.has(group)) {
          rankGroups.set(group, []);
        }
        rankGroups.get(group)!.push(item);
      });

      // 按指定顺序[2,3,1,0]组织位次段，每个位次段包含该位次段下的所有学校
      const orderedRankGroups = [2, 3, 1, 0]
        .map((groupIndex) => {
          const items = rankGroups.get(groupIndex) || [];

          // 按学校分组
          const schoolMap = new Map<string, AlternativeItem[]>();
          items.forEach((item) => {
            if (!schoolMap.has(item.schoolCode)) {
              schoolMap.set(item.schoolCode, []);
            }
            schoolMap.get(item.schoolCode)!.push(item);
          });

          // 创建学校组，每个学校组包含该位次段下的所有专业
          const schools = Array.from(schoolMap.entries()).map(([schoolCode, schoolItems]) => {
            const firstItem = schoolItems[0];
            return {
              schoolCode,
              schoolName: firstItem.schoolName,
              majors: schoolItems,
              isExpanded: false,
            };
          });

          return {
            groupIndex,
            groupName: groupNames[groupIndex],
            schools,
          };
        })
        .filter((rankGroup) => rankGroup.schools.length > 0); // 只保留有学校的位次段

      return {
        majorCode: majorGroup.majorCode,
        majorName: majorGroup.majorName,
        schools: [], // 保持兼容性，但实际使用rankGroups
        rankGroups: orderedRankGroups,
        isExpanded: false,
      };
    });
  };

  // 处理排序Tab切换
  const handleSortTabChange = async (tab: 'major' | 'rankDiff') => {
    // 如果切换到按专业排序，需要重新调用API
    if (tab === 'major') {
      try {
        setIsLoadingMajorData(true);
        dispatch(setLoading(true));

        // 调用API获取按专业排序的数据
        const nominateResponse = await nominate({ sortByMajor: true });
        console.log(nominateResponse);
        if (nominateResponse && nominateResponse.code === 200) {
          // 当sortByMajor=true时，API返回的是majors数组而不是schools数组
          const majorsData = nominateResponse.data.majors || [];

          // 将API返回的专业数据转换为我们的格式
          const convertedData: AlternativeItem[] = [];
          console.log('majorsData', majorsData);
          majorsData.forEach((major: any, majorIndex: number) => {
            if (major.schools && Array.isArray(major.schools)) {
              major.schools.forEach((school: any, schoolIndex: number) => {
                convertedData.push({
                  id: `${school.id}_${major.code}`,
                  majorCode: major.code || '',
                  majorName: major.name || '',
                  schoolCode: school.schoolCode || school.code || '',
                  schoolName: school.schoolName || school.name || '',
                  priority: majorIndex * 1000 + schoolIndex, // 使用组合索引作为优先级
                  createdAt: new Date().toISOString(),
                  score: 0,
                  selected: false,
                  historyScore: school.historyScores || school.historyScore || [],
                  group: school.group || 0,
                  enrollmentRate: school.enrollmentRate || 0,
                  employmentRate: school.employmentRate || 0,
                  Rankdiff: school.rankDiff || 0,
                  RankdiffPer: school.rankDiffPer || 0,
                  schoolFeature: school.schoolFeature || school.features || '',
                  schoolNature: school.schoolNature || school.belong || '',
                  schoolLevel: '专科',
                  majorGroupId:
                    school.majorGroupId?.toString() || major.majorGroupId?.toString() || '',
                  majorGroupName: school.majorGroupName || major.majorGroupName || '',
                  schoolCity: school.cityName || '',
                  provinceName: school.provinceName || '',
                  cityName: school.cityName || '',
                  sortIndex: majorIndex * 1000 + schoolIndex,
                  developmentPotential: parseFloat(major.developmentPotential || '0'),
                  position: majorIndex * 1000 + schoolIndex,
                  admissionsSite: '',
                  admissionsPhone: '',
                });
              });
            }
          });

          // 按专业分组数据
          const majorGroups = groupByMajorAndRank(convertedData);

          // 转换为GroupedAlternatives格式
          const groupedData = majorGroups.map((majorGroup, index) => ({
            group: -1000 - index,
            result:
              majorGroup.rankGroups?.flatMap((rankGroup) =>
                rankGroup.schools.flatMap((school) => school.majors)
              ) || [],
            majorGroup: majorGroup,
          }));

          // 更新Redux状态
          dispatch(setAlternatives(groupedData));

          // 保存按专业排序的数据到localStorage
          localStorage.setItem('aiVolunteerMajorData', JSON.stringify(groupedData));
        }
      } catch (error) {
        message.error('获取按专业排序数据失败，请重试');
      } finally {
        setIsLoadingMajorData(false);
        dispatch(setLoading(false));
      }
    }

    // 更新排序Tab
    dispatch(setSortTab(tab));
  };

  // 根据当前排序Tab对数据进行排序
  const getSortedData = useCallback(
    (data: GroupedAlternatives[]) => {
      switch (sortTab) {
        case 'major': {
          // 从localStorage获取按专业排序的数据
          const majorDataStr = localStorage.getItem('aiVolunteerMajorData');
          if (majorDataStr) {
            try {
              const majorData = JSON.parse(majorDataStr);
              return majorData;
            } catch (error) {
              // 解析按专业排序数据失败
            }
          }

          // 如果无法获取按专业排序数据，则使用当前数据进行分组
          const allData = data.flatMap((group) => group.result);
          const majorGroups = groupByMajorAndRank(allData);

          // 按发展潜能排序专业组
          const sortedMajorGroups = majorGroups.sort((a, b) => {
            const aMaxPotential = Math.max(
              ...(a.rankGroups?.flatMap((rankGroup) =>
                rankGroup.schools.flatMap((school) =>
                  school.majors.map((major) => major.developmentPotential || 0)
                )
              ) || [0])
            );
            const bMaxPotential = Math.max(
              ...(b.rankGroups?.flatMap((rankGroup) =>
                rankGroup.schools.flatMap((school) =>
                  school.majors.map((major) => major.developmentPotential || 0)
                )
              ) || [0])
            );
            return bMaxPotential - aMaxPotential;
          });

          // 转换为原有的GroupedAlternatives格式，但使用特殊的group标识
          return sortedMajorGroups.map((majorGroup, index) => ({
            group: -1000 - index, // 使用负数避免与位次段分组冲突
            result:
              majorGroup.rankGroups?.flatMap((rankGroup) =>
                rankGroup.schools.flatMap((school) => school.majors)
              ) || [],
            majorGroup: majorGroup, // 添加专业组信息
          }));
        }
        case 'rankDiff': {
          // 使用原始API返回的数据顺序，不进行任何排序
          // 从localStorage获取原始顺序数据
          const originalDataStr = localStorage.getItem('aiVolunteerOriginalData');
          if (originalDataStr) {
            try {
              const originalData = JSON.parse(originalDataStr);
              return originalData;
            } catch (error) {
              // 解析原始数据失败
            }
          }

          // 如果无法获取原始数据，则使用当前数据但不进行排序
          const allRankDiffData = data.flatMap((group) => group.result);
          return [
            {
              group: -1000, // 使用负数避免与位次段分组冲突
              result: allRankDiffData,
            },
          ];
        }
        default:
          // 按位次段分组排列（保持原有逻辑）
          return data;
      }
    },
    [sortTab]
  );

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

  // 搜索过滤逻辑
  const filterDataBySearch = useCallback(
    (data: AlternativeItem[]) => {
      return data.filter((item) => {
        // 搜索文本过滤
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          searchText === '' ||
          item.schoolName.toLowerCase().includes(searchLower) ||
          item.majorName.toLowerCase().includes(searchLower) ||
          item.majorCode.toLowerCase().includes(searchLower) ||
          getCityDisplayInfo(item).toLowerCase().includes(searchLower) ||
          (item.provinceName && isProvinceMatch(searchText, item.provinceName));

        // 学校性质过滤
        const matchesNature =
          selectedSchoolNature === 'all' || item.schoolNature === selectedSchoolNature;

        return matchesSearch && matchesNature;
      });
    },
    [searchText, selectedSchoolNature]
  );

  // 根据当前Tab过滤数据
  const getFilteredData = useCallback(() => {
    // 备选志愿页面显示所有志愿（包括未入选的）
    const sortedData = getSortedData(alternatives);

    // 应用搜索过滤
    return sortedData
      .map((group: GroupedAlternatives) => ({
        ...group,
        result: filterDataBySearch(group.result),
      }))
      .filter((group: GroupedAlternatives) => group.result.length > 0);
  }, [alternatives, getSortedData, filterDataBySearch]);

  useEffect(() => {
    // 页面初始化逻辑
    const initializePage = async () => {
      try {
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

        // 获取自动推荐的志愿
        const nominateResponse = await nominate();

        // 处理自动推荐志愿数据
        if (nominateResponse && nominateResponse.code === 200) {
          // 服务器返回的数据结构是 { schools, total, volunteerCount, recommendCount }
          const nominateData = nominateResponse.data.schools || [];

          // 从API响应中获取推荐志愿数量
          const apiRecommendCount = nominateResponse.data.recommendCount;
          if (apiRecommendCount !== undefined) {
            dispatch(setRecommendCount(apiRecommendCount));
          }

          // 获取已备选志愿状态
          try {
            const alternativesResponse = await getMajorAlternatives();
            if (alternativesResponse && alternativesResponse.code === 200) {
              const alternatives = alternativesResponse.data?.data || [];
              const alternativeMap: { [key: string]: { isAlternative: boolean; id?: string } } = {};

              // 构建已备选学校的映射
              alternatives.forEach((item: any) => {
                const schoolKey = `${item.schoolCode}_${item.majorCode}`;
                alternativeMap[schoolKey] = { isAlternative: true, id: item.id };
              });

              dispatch(setAlternativeStatus(alternativeMap));
            }
          } catch (error) {
            // 获取备选状态失败
          }

          // 设置高发展潜能专业数量（根据发展潜能计算）
          const topDevelopmentCount = nominateData.filter(
            (item: any) => item.major && parseFloat(item.major.developmentPotential || '0') > 70
          ).length;
          localStorage.setItem('topDevelopmentCount', topDevelopmentCount.toString());

          // 将 API 返回的数据转换为我们的类型
          const convertedData: AlternativeItem[] = nominateData.map((item: any, index: number) => ({
            id: `${item.id}_${item.major?.code || 'unknown'}`,
            majorCode: item.major?.code || '',
            majorName: item.major?.name || '',
            schoolCode: item.schoolCode || '', // 使用学校名称作为学校代码
            schoolName: item.schoolName || '',
            priority: index + 1, // 使用索引作为优先级
            createdAt: new Date().toISOString(), // 使用当前时间
            score: 0, // 默认值，后续可以根据需要调整
            selected: false, // 默认未入选
            historyScore: item.historyScores || [],
            group: item.group,
            enrollmentRate: item.enrollmentRate,
            employmentRate: item.employmentRate,
            Rankdiff: item.rankDiff, // 位次差
            RankdiffPer: item.rankDiffPer, // 位次差百分比
            // 学校标签相关属性
            schoolFeature: item.schoolFeature || '', // 学校特色
            schoolNature: item.schoolNature, // 根据belong判断公办民办
            schoolLevel: '专科', // 根据实际情况调整
            majorGroupId: item.majorGroupId?.toString() || '', // 专业组ID
            majorGroupName: item.majorGroupName || '', // 专业组名称
            schoolCity: item.cityName || '', // 学校所在城市
            provinceName: item.provinceName || '', // 省份名称
            cityName: item.cityName || '', // 城市名称
            sortIndex: index, // 添加排序索引
            developmentPotential: parseFloat(item.major?.developmentPotential || '0'), // 发展潜能
            position: index, // 位置排序字段
            // 招生信息相关属性
            admissionsSite: '', // 默认值
            admissionsPhone: '', // 默认值
          }));

          // 为了保持API返回的原始顺序，我们需要保存原始数据
          // 同时也要支持按位次段分组的功能
          const originalData = convertedData; // 保存原始顺序的数据

          const groupByCategory = (
            arr: AlternativeItem[],
            key: keyof AlternativeItem
          ): GroupedAlternatives[] => {
            const groupedMap = arr.reduce(
              (map: Map<any, AlternativeItem[]>, item: AlternativeItem) => {
                const groupValue = item[key];
                if (!map.has(groupValue)) {
                  map.set(groupValue, []); // 初始化该分类的数组
                }
                map.get(groupValue)!.push(item); // 添加当前项到对应分类
                return map;
              },
              new Map()
            );

            // 转换为目标格式
            return Array.from(groupedMap).map(([category, result]) => ({
              group: category,
              result,
            }));
          };
          const alternativesGroup = groupByCategory(convertedData, 'group');

          // 对分组进行排序：2 -> 3 -> 1 -> 0
          const sortedAlternativesGroup = alternativesGroup.sort((a, b) => {
            const orderMap: { [key: number]: number } = { 2: 0, 3: 1, 1: 2, 0: 3 };
            return orderMap[a.group] - orderMap[b.group];
          });

          // 同时保存原始顺序的数据，用于rankDiff模式
          const originalOrderData = [
            {
              group: -999, // 使用特殊标识表示原始顺序
              result: originalData,
            },
          ];

          // 将原始顺序数据也存储到Redux中，以便rankDiff模式使用
          dispatch(setAlternatives(sortedAlternativesGroup));
          // 将原始顺序数据存储到localStorage中，供rankDiff模式使用
          localStorage.setItem('aiVolunteerOriginalData', JSON.stringify(originalOrderData));
        }
      } catch (error) {
        // 页面初始化失败
      } finally {
        dispatch(setLoading(false));
        dispatch(setHasInitialized(true));
      }
    };

    initializePage();
  }, [dispatch]);

  // 渲染空状态提示
  const renderEmptyState = () => (
    <div className="w-full max-w-xl bg-white rounded-2xl  p-6 text-center">
      <div className="mb-4">
        <div className="text-gray-400 text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">暂无备选志愿</h3>
        <p className="text-gray-500 text-sm mb-6">
          您还没有任何备选志愿，快去意向页面选择您感兴趣的院校和专业吧！
        </p>
      </div>
      <button
        onClick={() => handleNavigation('/intention')}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        去意向页面备选
      </button>
    </div>
  );

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
        const historyScoreData =
          item.historyScore?.map((item: any) => {
            const scoreData: { [key: string]: string } = {};
            item.historyScore?.forEach((hs: any) => {
              for (const [key, value] of Object.entries(hs)) {
                scoreData[key] = value as string;
              }
            });
            return scoreData;
          }) || [];

        // 调用创建备选志愿接口
        const response = await createMajorAlternative({
          majorCode: item.majorCode,
          majorName: item.majorName,
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

  const scaleAnswerCount = localStorage.getItem('scaleAnswerCount');

  if (scaleAnswerCount && Number(scaleAnswerCount) !== 168) {
    return (
      <>
        <StartWelcomePage />
        <BottomNav selectedIndex={0} />
      </>
    );
  }

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
                  历年录取分数
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

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top
        title={'AI推荐志愿' + recommendCount + '个'}
        onBack={() => window.history.back()}
        showRestartButton={true}
      />

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
          </div>
        </div>

        {/* 搜索结果统计 */}
        {(searchText || selectedSchoolNature !== 'all') && (
          <div className="w-full max-w-xl bg-blue-50 rounded-2xl p-3 mb-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-medium">搜索结果：</span>
                <span className="text-blue-800">找到 {totalItems} 个志愿</span>
              </div>
              <button
                onClick={() => {
                  setSearchText('');
                  setSelectedSchoolNature('all');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                清除筛选
              </button>
            </div>
          </div>
        )}

        {/* 排序Tab选项卡 - 独立的card */}
        <div className="w-full max-w-xl bg-white rounded-2xl p-4 mb-0">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSortTabChange('rankDiff')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortTab === 'rankDiff'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              按位次差
            </button>

            <button
              onClick={() => handleSortTabChange('major')}
              disabled={isLoadingMajorData}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortTab === 'major'
                  ? 'bg-blue-500 text-white shadow-md'
                  : isLoadingMajorData
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isLoadingMajorData ? '加载中...' : '按专业'}
            </button>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="w-full max-w-xl bg-white rounded-2xl mt-3 p-6 text-center">
            <div className="text-gray-500">加载中...</div>
          </div>
        )}

        {/* 备选志愿列表 */}
        {!loading && (
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
                  // 检查是否为按专业分组的数据
                  const isMajorGroup = group.group <= -1000 && (group.result[0] as any).majorGroup;

                  let schoolGroups: SchoolGroup[];
                  let rankGroups: any[] = [];

                  if (isMajorGroup) {
                    // 按专业分组的数据
                    const majorGroup = (group.result[0] as any).majorGroup as MajorGroup;
                    rankGroups = majorGroup?.rankGroups || [];
                    schoolGroups = rankGroups.flatMap((rankGroup) => rankGroup.schools);
                  } else {
                    // 按位次段分组的数据
                    schoolGroups = groupBySchool(group.result);
                  }

                  // 按专业排序时显示所有学校，其他排序时也显示所有学校
                  const displaySchools = schoolGroups;

                  return (
                    <div
                      key={group.group + 'group'}
                      className={
                        sortTab === 'major'
                          ? 'w-full max-w-xl bg-white rounded-2xl  mt-3'
                          : 'w-full max-w-xl bg-white rounded-2xl  mt-3 p-2'
                      }
                    >
                      {/* 按专业排序时显示层级结构 */}
                      {sortTab === 'major' ? (
                        <div className="w-full max-w-xl bg-white rounded-2xl  mt-3">
                          {/* 专业信息头部 - 完全按照intentiondetail.tsx的样式 */}
                          <div
                            className="flex items-center justify-between bg-[#dee9fd] rounded-t-xl p-4 mb-1"
                            onClick={() => {
                              if (isMajorGroup && (group.result[0] as any).majorGroup) {
                                const majorGroup = (group.result[0] as any)
                                  .majorGroup as MajorGroup;
                                handleNavigation(
                                  `/major/majorlovedetail?majorCode=${majorGroup.majorCode}&&majorName=${majorGroup.majorName}&score=${majorGroup.rankGroups?.[0]?.schools?.[0]?.majors?.[0]?.score || 0}&isFavorite=true`,
                                  { replace: false }
                                );
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span className="text-blue-600 text-base font-bold mr-3">
                                {isMajorGroup && (group.result[0] as any).majorGroup
                                  ? (group.result[0] as any).majorGroup.majorCode
                                  : group.result[0]?.majorCode}
                              </span>
                              <span className="text-blue-700 text-base font-bold">
                                {(() => {
                                  const majorName =
                                    isMajorGroup && (group.result[0] as any).majorGroup
                                      ? (group.result[0] as any).majorGroup.majorName
                                      : group.result[0]?.majorName || '';
                                  return majorName.length > 8
                                    ? `${majorName.substring(0, 8)}...`
                                    : majorName;
                                })()}{' '}
                              </span>
                              <span className="ml-2 text-gray-400">&gt;</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-900 font-bold mr-2">发展潜能</span>
                              <span className="text-blue-700 font-bold text-base">
                                {Math.ceil(
                                  (isMajorGroup && (group.result[0] as any).majorGroup
                                    ? (group.result[0] as any).majorGroup.rankGroups?.[0]
                                        ?.schools?.[0]?.majors?.[0]?.developmentPotential
                                    : group.result[0]?.developmentPotential) || 0
                                )}
                                分！
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 p-2">
                            {/* 位次段分组显示 */}
                            {isMajorGroup &&
                            (group.result[0] as any).majorGroup &&
                            rankGroups.length > 0 ? (
                              rankGroups.map((rankGroup) => {
                                const filteredSchools = rankGroup.schools;

                                // 如果没有学校，不显示该位次段
                                if (filteredSchools.length === 0) {
                                  return null;
                                }

                                return (
                                  <div key={rankGroup.groupIndex} className="mb-5">
                                    {/* 位次段标题 */}
                                    <div className="flex items-center justify-between font-bold mb-4 text-sm border-b border-solid pb-3 border-gray-200 pr-0">
                                      <div className="flex items-center">
                                        <span className="text-gray-900">
                                          {' '}
                                          {rankGroup.groupName}{' '}
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="text-gray-600 text-sm mr-1">
                                          {rankGroup.schools.length}所院校
                                        </span>
                                      </div>
                                    </div>

                                    {/* 该位次段的院校列表 */}
                                    {rankGroup.schools.map((schoolGroup: SchoolGroup) => (
                                      <div
                                        key={schoolGroup.schoolCode}
                                        className="border border-gray-200 mb-4 overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                                      >
                                        {/* 院校头部 */}
                                        <div className="p-4">
                                          {/* 学校名称和操作按钮行 */}
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                              <span
                                                className="text-blue-600 text-lg font-bold cursor-pointer hover:text-blue-700 transition-colors duration-200 truncate block"
                                                title={schoolGroup.schoolName}
                                                onClick={() => {
                                                  handleNavigation(
                                                    `/major/schooldetail?schoolCode=${schoolGroup.schoolCode}&schoolname=${schoolGroup.schoolName}`
                                                  );
                                                }}
                                              >
                                                {schoolGroup.schoolName.length > 10
                                                  ? `${schoolGroup.schoolName.substring(0, 10)}...`
                                                  : schoolGroup.schoolName}
                                              </span>
                                            </div>
                                            {/* 操作按钮 */}
                                            <div className="flex space-x-2">
                                              {schoolGroup.majors.map((item: any) => {
                                                const itemKey = `${item.schoolCode}_${item.majorCode}`;
                                                const isAlternative =
                                                  alternativeStatus[itemKey]?.isAlternative ||
                                                  false;
                                                const isLoading = loadingStatus[itemKey];

                                                return (
                                                  <button
                                                    key={item.id}
                                                    className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                                      isAlternative
                                                        ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                                                        : isLoading
                                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                          : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                                                    }`}
                                                    onClick={() => handleAlternativeClick(item)}
                                                    disabled={isLoading}
                                                  >
                                                    {isLoading
                                                      ? '处理中...'
                                                      : isAlternative
                                                        ? '移除'
                                                        : '备选'}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {/* 专业信息行 */}
                                          {schoolGroup.majors.map((item: any) => (
                                            <div key={item.id}>
                                              <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                  <span className="text-blue-700 text-sm mr-2">
                                                    {item.majorCode} {item.majorName}
                                                  </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  {getRankdiffDom(item)}
                                                </div>
                                              </div>
                                              <div className="flex flex-wrap gap-2 mb-3">
                                                {/* 学校特色标签 */}
                                                {parseSchoolFeatures(item.schoolFeature).map(
                                                  (feature, index) => (
                                                    <span
                                                      key={`${item.schoolName}-feature-${index}`}
                                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
                                                    >
                                                      {feature}
                                                    </span>
                                                  )
                                                )}
                                                <span
                                                  key={item.schoolName + '公办'}
                                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                                                >
                                                  {item.schoolNature === 'public' ? '公办' : '民办'}
                                                </span>
                                                {item.enrollmentRate && item.enrollmentRate > 0 && (
                                                  <span
                                                    key={item.schoolName + '升学率'}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                                  >
                                                    升学率{item.enrollmentRate}%
                                                  </span>
                                                )}

                                                {/* 学制标签 */}
                                                {item.historyScore &&
                                                  item.historyScore.length > 0 &&
                                                  item.historyScore[0].studyPeriod && (
                                                    <span
                                                      key={item.schoolName + '学制'}
                                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                                    >
                                                      学制{item.historyScore[0].studyPeriod}年
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
                                            </div>
                                          ))}
                                        </div>

                                        {/* 历年分数表格 */}
                                        {schoolGroup.majors.map((item: any) => (
                                          <div
                                            key={item.id}
                                            className="px-4 pb-4 bg-gray-50 rounded-b-lg"
                                            dangerouslySetInnerHTML={{
                                              __html: getHistoryScore(item?.historyScore || []),
                                            }}
                                          ></div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })
                            ) : (
                              // 如果没有位次段分组，显示简单的学校列表
                              <div className="space-y-4">
                                {displaySchools.map((schoolGroup: SchoolGroup) => (
                                  <div
                                    key={schoolGroup.schoolCode}
                                    className="border border-gray-200 mb-4 overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                                  >
                                    {/* 院校头部 */}
                                    <div className="p-4">
                                      {/* 学校名称和操作按钮行 */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                          <span
                                            className="text-blue-600 text-lg font-bold cursor-pointer hover:text-blue-700 transition-colors duration-200 truncate block"
                                            title={schoolGroup.schoolName}
                                            onClick={() => {
                                              handleNavigation(
                                                `/major/schooldetail?schoolCode=${schoolGroup.schoolCode}&schoolname=${schoolGroup.schoolName}`
                                              );
                                            }}
                                          >
                                            {schoolGroup.schoolName.length > 10
                                              ? `${schoolGroup.schoolName.substring(0, 10)}...`
                                              : schoolGroup.schoolName}
                                          </span>
                                        </div>
                                        {/* 操作按钮 */}
                                        <div className="flex space-x-2">
                                          {schoolGroup.majors.map((item: any) => {
                                            const itemKey = `${item.schoolCode}_${item.majorCode}`;
                                            const isAlternative =
                                              alternativeStatus[itemKey]?.isAlternative || false;
                                            const isLoading = loadingStatus[itemKey];

                                            return (
                                              <button
                                                key={item.id}
                                                className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                                  isAlternative
                                                    ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                                                    : isLoading
                                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                      : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                                                }`}
                                                onClick={() => handleAlternativeClick(item)}
                                                disabled={isLoading}
                                              >
                                                {isLoading
                                                  ? '处理中...'
                                                  : isAlternative
                                                    ? '移除'
                                                    : '备选'}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* 专业信息行 */}
                                      {schoolGroup.majors.map((item: any) => (
                                        <div key={item.id}>
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center">
                                              <span className="text-blue-700 text-sm mr-2">
                                                {item.majorCode} {item.majorName}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              {getRankdiffDom(item)}
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap gap-2 mb-3">
                                            {/* 学校特色标签 */}
                                            {parseSchoolFeatures(item.schoolFeature).map(
                                              (feature, index) => (
                                                <span
                                                  key={`${item.schoolName}-feature-${index}`}
                                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
                                                >
                                                  {feature}
                                                </span>
                                              )
                                            )}
                                            <span
                                              key={item.schoolName + '公办'}
                                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                                            >
                                              {item.schoolNature === 'public' ? '公办' : '民办'}
                                            </span>
                                            {item.enrollmentRate && item.enrollmentRate > 0 && (
                                              <span
                                                key={item.schoolName + '升学率'}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                              >
                                                升学率{item.enrollmentRate}%
                                              </span>
                                            )}

                                            {/* 学制标签 */}
                                            {item.historyScore &&
                                              item.historyScore.length > 0 &&
                                              item.historyScore[0].studyPeriod && (
                                                <span
                                                  key={item.schoolName + '学制'}
                                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                                >
                                                  学制{item.historyScore[0].studyPeriod}年
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
                                        </div>
                                      ))}
                                    </div>

                                    {/* 历年分数表格 */}
                                    {schoolGroup.majors.map((item: any) => (
                                      <div
                                        key={item.id}
                                        className="px-4 pb-4 bg-gray-50 rounded-b-lg"
                                        dangerouslySetInnerHTML={{
                                          __html: getHistoryScore(item?.historyScore || []),
                                        }}
                                      ></div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : sortTab === 'rankDiff' ? (
                        /* 按位次差排序时的列表显示 */
                        <div className="w-full max-w-xl bg-white rounded-2xl">
                          {group.result.map((item: any) => (
                            <div
                              key={item.id}
                              className="mb-4 border-b border-gray-200 pb-4 last:border-b-0"
                            >
                              {/* 学校名称 */}
                              <div className="flex items-center justify-between mb-3">
                                <span
                                  className="text-blue-600 text-lg font-bold cursor-pointer hover:text-blue-700 transition-colors duration-200"
                                  onClick={() => {
                                    handleNavigation(
                                      `/major/schooldetail?schoolCode=${item.schoolCode}&schoolname=${item.schoolName}`
                                    );
                                  }}
                                >
                                  {item.schoolName}
                                </span>
                                <button
                                  className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${(() => {
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

                              {/* 专业信息 */}
                              <div className="flex items-center justify-between mb-3">
                                <span
                                  className="text-blue-700 text-sm cursor-pointer hover:text-blue-800"
                                  onClick={() => {
                                    handleNavigation(
                                      `/major/majorlovedetail?majorCode=${item.majorCode}&&majorName=${item.majorName}&score=${item.score}&isFavorite=true`,
                                      { replace: false }
                                    );
                                  }}
                                >
                                  {item.majorCode} {item.majorName}
                                </span>
                                {getRankdiffDom(item)}
                              </div>

                              {/* 学校标签行 */}
                              <div className="flex flex-wrap gap-2 mb-3">
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
                                {item.enrollmentRate && item.enrollmentRate > 0 && (
                                  <span
                                    key={item.schoolName + '升学率'}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                  >
                                    升学率{item.enrollmentRate}%
                                  </span>
                                )}

                                {/* 学制标签 */}
                                {item.historyScore &&
                                  item.historyScore.length > 0 &&
                                  item.historyScore[0].studyPeriod && (
                                    <span
                                      key={item.schoolName + '学制'}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                    >
                                      学制{item.historyScore[0].studyPeriod}年
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
                                className="bg-gray-50 rounded-b-lg"
                                dangerouslySetInnerHTML={{
                                  __html: getHistoryScore(item?.historyScore || []),
                                }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* 原有的渲染逻辑（位次段排序等） */
                        displaySchools.map((schoolGroup) => (
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
                                      className={`text-blue-700 text-[14px] mr-2 ${item.majorName.length > 8 ? 'cursor-pointer hover:text-blue-800' : ''}`}
                                      onClick={() => {
                                        handleNavigation(
                                          `/major/majorlovedetail?majorCode=${item.majorCode}&&majorName=${item.majorName}&score=${item.score}&isFavorite=true`,
                                          { replace: false } // 不使用 replace，保持正常的导航历史
                                        );
                                      }}
                                    >
                                      {item.majorCode}{' '}
                                      {item.majorName.length > 5
                                        ? item.majorName.substring(0, 5) + '...'
                                        : item.majorName}
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
                                  {item.enrollmentRate && item.enrollmentRate > 0 && (
                                    <span
                                      key={item.schoolName + '升学率'}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                    >
                                      升学率{item.enrollmentRate}%
                                    </span>
                                  )}

                                  {/* 学制标签 */}
                                  {item.historyScore &&
                                    item.historyScore.length > 0 &&
                                    item.historyScore[0].studyPeriod && (
                                      <span
                                        key={item.schoolName + '学制'}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                      >
                                        学制{item.historyScore[0].studyPeriod}年
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
                        ))
                      )}
                    </div>
                  );
                })}

                {/* 加载更多提示 */}
                {isLoadingMore && (
                  <div className="w-full max-w-xl bg-white rounded-2xl  mt-3 p-6 text-center">
                    <div className="text-gray-500">加载中...</div>
                  </div>
                )}

                {/* 显示更多按钮 */}
                {!isLoadingMore && displayCount < totalItems && (
                  <div className="w-full max-w-xl bg-white rounded-2xl  mt-3 p-6 text-center">
                    <button
                      onClick={() => {
                        setIsLoadingMore(true);
                        setTimeout(() => {
                          dispatch(setDisplayCount(displayCount + 10));
                          setIsLoadingMore(false);
                        }, 500);
                      }}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
    </div>
  );
};

export default RecUnisPage;
