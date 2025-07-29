import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Checkbox } from 'antd';

import BottomNav from '../comm/bottom';
import StartWelcomePage from '../selfassessment/startWelcome';
import Top from '../comm/top';
import {
  getMajorAlternatives,
  selectAlternative,
  cancelAlternative,
  getMajorGroup,
  moveUpAlternative,
  moveDownAlternative,
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
  sortIndex?: number; // 手动排序索引
  developmentPotential?: number; // 发展潜能
  topDevelopmentCount?: number; // 高发展潜能专业数量
  position?: number; // 位置排序字段
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

const EducationalPage: React.FC = () => {
  const navigate = useNavigate();
  const [alternatives, setAlternatives] = useState<GroupedAlternatives[]>([]);
  const [alternativesCount, setAlternativesCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0); // 添加入选志愿数量
  const [loading, setLoading] = useState(true); // 添加加载状态

  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({}); // 添加按钮加载状态

  // 弹框相关状态
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  const [userChoices, setUserChoices] = useState({
    choice1: false,
    choice2: false,
  });

  // 主Tab状态 - 控制志愿显示方式
  const [activeTab, setActiveTab] = useState<'alternatives' | 'selected'>('alternatives');

  // 排序Tab状态 - 控制排序方式
  const [sortTab, setSortTab] = useState<
    'group' | 'enrollment' | 'employment' | 'willingness' | 'major' | 'rankDiff'
  >('group');

  // 添加取消入选确认对话框状态
  const [showUnselectDialog, setShowUnselectDialog] = useState(false);
  const [itemToUnselect, setItemToUnselect] = useState<AlternativeItem | null>(null);

  // 分别为备选志愿和入选志愿管理展开状态
  const [expandedAlternatives, setExpandedAlternatives] = useState<{ [key: number]: boolean }>({});
  const [expandedSelected, setExpandedSelected] = useState<{ [key: number]: boolean }>({});

  // 添加入选确认对话框状态
  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const [itemToSelect, setItemToSelect] = useState<AlternativeItem | null>(null);
  const [selectConfirmations, setSelectConfirmations] = useState({
    requirement: false,
    enrollment: false,
    majorGroup: false,
  });

  // 添加专业组弹窗状态
  const [showMajorGroupDialog, setShowMajorGroupDialog] = useState(false);
  const [majorGroupData, setMajorGroupData] = useState<MajorGroupItem[]>([]);
  const [majorGroupLoading, setMajorGroupLoading] = useState(false);
  const [currentMajorGroupInfo, setCurrentMajorGroupInfo] = useState<{
    majorGroupId: string;
    majorGroupName: string;
    schoolName: string;
  } | null>(null);

  // 获取志愿数量配置
  const [volunteerCount, setVolunteerCount] = useState('6'); // 默认6个志愿

  // 添加预警弹窗相关状态
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningChoices, setWarningChoices] = useState({
    todayNotShow: false,
  });

  // 添加高发展潜能预警相关状态
  const [showTopDevelopmentWarningModal, setShowTopDevelopmentWarningModal] = useState(false);
  const [topDevelopmentWarningChoices, setTopDevelopmentWarningChoices] = useState({
    todayNotShow: false,
  });

  // 添加手动排序相关状态
  const [manualSortData, setManualSortData] = useState<AlternativeItem[]>([]);
  const [isManualSortMode, setIsManualSortMode] = useState(false);

  // 处理入选确认选项变化
  const handleSelectConfirmationChange = (
    key: keyof typeof selectConfirmations,
    checked: boolean
  ) => {
    setSelectConfirmations((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  // 检查是否所有确认项都已选中
  const isAllConfirmed = Object.values(selectConfirmations).every((value) => value);

  // 处理入选确认
  const handleConfirmSelect = async () => {
    if (!itemToSelect || !isAllConfirmed) return;

    const itemKey = `${itemToSelect.schoolCode}_${itemToSelect.majorCode}`;

    try {
      // 设置加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: true }));

      // 调用入选接口
      const response = await selectAlternative(itemToSelect.id);

      if (response && response.code === 200) {
        // 更新本地状态
        setAlternatives((prevAlternatives) =>
          prevAlternatives.map((group) => ({
            ...group,
            result: group.result.map((resultItem) =>
              resultItem.id === itemToSelect.id ? { ...resultItem, selected: true } : resultItem
            ),
          }))
        );

        // 更新入选数量
        setSelectedCount((prev) => prev + 1);

        console.log('入选成功');
      } else {
        alert(response?.message || '入选失败');
      }
    } catch (error) {
      console.error('入选失败:', error);
      alert(error instanceof Error ? error.message : '入选失败');
    } finally {
      // 清除加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: false }));
      // 关闭对话框并重置状态
      setShowSelectDialog(false);
      setItemToSelect(null);
      setSelectConfirmations({
        requirement: false,
        enrollment: false,
        majorGroup: false,
      });
    }
  };

  // 取消入选确认
  const handleCancelSelect = () => {
    setShowSelectDialog(false);
    setItemToSelect(null);
    setSelectConfirmations({
      requirement: false,
      enrollment: false,
      majorGroup: false,
    });
  };

  // 查看专业组详情
  const handleViewMajorGroup = async () => {
    if (itemToSelect?.majorGroupId) {
      try {
        setMajorGroupLoading(true);
        setCurrentMajorGroupInfo({
          majorGroupId: itemToSelect.majorGroupId,
          majorGroupName: itemToSelect.majorGroupName || '',
          schoolName: itemToSelect.schoolName,
        });

        // 调用专业组API
        const response = await getMajorGroup(itemToSelect.majorGroupId);

        if (response && response.code === 200) {
          setMajorGroupData(response.data || []);
          setShowMajorGroupDialog(true);
        } else {
          alert(response?.message || '获取专业组信息失败');
        }
      } catch (error) {
        console.error('获取专业组信息失败:', error);
        alert(error instanceof Error ? error.message : '获取专业组信息失败');
      } finally {
        setMajorGroupLoading(false);
      }
    }
  };

  // 关闭专业组弹窗
  const handleCloseMajorGroupDialog = () => {
    setShowMajorGroupDialog(false);
    setMajorGroupData([]);
    setCurrentMajorGroupInfo(null);
  };

  const groupNames = [
    '其他位次段院校',
    '（+5%）到（+30%）位次段院校',
    '（-10%）到+（+5%）位次段院校',
    '（-30%） 到 （-10%）位次段院校',
  ];

  // 处理用户选择变化
  const handleChoiceChange = useCallback((choice: 'choice1' | 'choice2', checked: boolean) => {
    setUserChoices((prev) => ({
      ...prev,
      [choice]: checked,
    }));
  }, []);

  // 处理预警弹窗选择变化
  const handleWarningChoiceChange = useCallback((checked: boolean) => {
    setWarningChoices((prev) => ({
      ...prev,
      todayNotShow: checked,
    }));
  }, []);

  // 处理预警弹窗确认
  const handleWarningModalConfirm = useCallback(() => {
    // 根据用户选择设置存储策略
    if (warningChoices.todayNotShow) {
      // 今天不显示
      const today = new Date().toDateString();
      localStorage.setItem('volunteer-warning-last-shown', today);
    }

    setShowWarningModal(false);
  }, [warningChoices]);

  // 处理预警弹窗关闭
  const handleWarningModalClose = useCallback(() => {
    setShowWarningModal(false);
  }, []);

  // 处理高发展潜能预警弹窗选择变化
  const handleTopDevelopmentWarningChoiceChange = useCallback((checked: boolean) => {
    setTopDevelopmentWarningChoices((prev) => ({
      ...prev,
      todayNotShow: checked,
    }));
  }, []);

  // 处理高发展潜能预警弹窗确认
  const handleTopDevelopmentWarningModalConfirm = useCallback(() => {
    // 根据用户选择设置存储策略
    if (topDevelopmentWarningChoices.todayNotShow) {
      // 今天不显示
      const today = new Date().toDateString();
      localStorage.setItem('volunteer-top-development-warning-last-shown', today);
    }

    setShowTopDevelopmentWarningModal(false);
  }, [topDevelopmentWarningChoices]);

  // 处理高发展潜能预警弹窗关闭
  const handleTopDevelopmentWarningModalClose = useCallback(() => {
    setShowTopDevelopmentWarningModal(false);
  }, []);

  // 处理提示弹窗确认
  const handleTipModalConfirm = useCallback(() => {
    // 根据用户选择设置不同的存储策略
    if (userChoices.choice1) {
      // 今天不显示
      const today = new Date().toDateString();
      localStorage.setItem('volunteer-tip-last-shown', today);
    }

    if (userChoices.choice2) {
      // 以后都不显示
      localStorage.setItem('volunteer-tip-never-show', 'true');
    }

    setIsTipModalVisible(false);
  }, [userChoices]);

  // 处理提示弹窗关闭
  const handleTipModalClose = useCallback(() => {
    setIsTipModalVisible(false);
  }, []);

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

  // 切换备选志愿分组展开状态
  const toggleAlternativesExpansion = (group: number) => {
    setExpandedAlternatives((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // 切换入选志愿分组展开状态
  const toggleSelectedExpansion = (group: number) => {
    setExpandedSelected((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // 处理主Tab切换
  const handleMainTabChange = (tab: 'alternatives' | 'selected') => {
    setActiveTab(tab);
    // 根据切换的tab设置对应的默认排序方式
    if (tab === 'selected') {
      setSortTab('willingness'); // 入选志愿默认按自主意愿
    } else {
      // 如果当前是"按自主意愿"排序，切换到"位次段"排序
      if (sortTab === 'willingness') {
        setSortTab('group');
      } else {
        setSortTab('group'); // 备选志愿默认按位次段
      }
    }
  };

  // 处理排序Tab切换
  const handleSortTabChange = (
    tab: 'group' | 'enrollment' | 'employment' | 'willingness' | 'major' | 'rankDiff'
  ) => {
    setSortTab(tab);
    // 如果切换到非自主意愿排序，重置手动排序模式
    if (tab !== 'willingness') {
      resetManualSort();
    }
  };

  // 根据当前排序Tab对数据进行排序
  const getSortedData = useCallback(
    (data: GroupedAlternatives[]) => {
      // 如果处于手动排序模式且按自主意愿排序，直接返回手动排序数据
      if (isManualSortMode && manualSortData.length > 0 && sortTab === 'willingness') {
        return [{ group: -1, result: manualSortData }];
      }

      switch (sortTab) {
        case 'enrollment': {
          // 按升学率倒序排列，不分组
          const allEnrollmentData = data.flatMap((group) => group.result);
          const sortedEnrollmentData = allEnrollmentData.sort(
            (a, b) => (b.enrollmentRate || 0) - (a.enrollmentRate || 0)
          );
          return [{ group: -1, result: sortedEnrollmentData }];
        }
        case 'employment': {
          // 按就业率倒序排列，不分组
          const allEmploymentData = data.flatMap((group) => group.result);
          const sortedEmploymentData = allEmploymentData.sort(
            (a, b) => (b.employmentRate || 0) - (a.employmentRate || 0)
          );
          return [{ group: -1, result: sortedEmploymentData }];
        }
        case 'willingness': {
          // 按自主意愿排序 - 直接显示API返回的数据，不进行排序
          if (activeTab === 'selected') {
            const allWillingnessData = data.flatMap((group) => group.result);
            // 按position字段排序，保持API返回的原始顺序
            const sortedWillingnessData = allWillingnessData.sort(
              (a, b) => (a.position || 0) - (b.position || 0)
            );
            return [{ group: -1, result: sortedWillingnessData }];
          } else {
            // 在备选志愿页面，如果意外使用了willingness排序，回退到group排序
            return data;
          }
        }
        case 'major': {
          // 按位次段分组，每个位次段内按发展潜能倒序排序
          const groupedByRank = data.map((group) => ({
            ...group,
            result: group.result.sort((a, b) => (b.developmentPotential || 0) - (a.developmentPotential || 0))
          }));
          return groupedByRank;
        }
        case 'rankDiff': {
          // 按位次差从低到高排序
          const allRankDiffData = data.flatMap((group) => group.result);
          const sortedRankDiffData = allRankDiffData.sort(
            (a, b) => (a.Rankdiff || 0) - (b.Rankdiff || 0)
          );
          return [{ group: -1, result: sortedRankDiffData }];
        }
        case 'group':
        default:
          // 按位次段分组排列（保持原有逻辑）
          return data;
      }
    },
    [sortTab, activeTab, isManualSortMode, manualSortData]
  );

  // 根据当前Tab过滤数据
  const getFilteredData = useCallback(() => {
    if (activeTab === 'selected') {
      // 入选志愿页面显示所有已入选的志愿
      const selectedData = alternatives
        .map((group) => ({
          ...group,
          result: group.result.filter((item) => item.selected),
        }))
        .filter((group) => group.result.length > 0);

      return getSortedData(selectedData);
    } else {
      // 备选志愿页面显示所有备选志愿
      return getSortedData(alternatives);
    }
  }, [alternatives, activeTab, getSortedData]);

  // 处理手动排序相关函数
  const handleMoveUp = async (item: AlternativeItem) => {
    // 只在入选志愿页面才允许手动排序
    if (activeTab !== 'selected') return;

    const itemKey = `${item.schoolCode}_${item.majorCode}_moveUp`;

    try {
      // 设置加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: true }));

      // 调用上移API
      const response = await moveUpAlternative(item.id);

      if (response && response.code === 200) {
        // 获取当前显示的数据
        let currentData: AlternativeItem[];
        if (isManualSortMode && manualSortData.length > 0) {
          currentData = [...manualSortData];
        } else {
          currentData = getFilteredData().flatMap((group) => group.result);
        }

        const currentIndex = currentData.findIndex((i) => i.id === item.id);

        if (currentIndex > 0) {
          const newData = [...currentData];
          [newData[currentIndex], newData[currentIndex - 1]] = [
            newData[currentIndex - 1],
            newData[currentIndex],
          ];

          // 更新排序索引
          newData.forEach((item, index) => {
            item.sortIndex = index;
          });

          setManualSortData(newData);
          setIsManualSortMode(true);

          console.log('上移成功');
        }
      } else {
        alert(response?.message || '上移失败');
      }
    } catch (error) {
      console.error('上移失败:', error);
      alert(error instanceof Error ? error.message : '上移失败');
    } finally {
      // 清除加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  const handleMoveDown = async (item: AlternativeItem) => {
    // 只在入选志愿页面才允许手动排序
    if (activeTab !== 'selected') return;

    const itemKey = `${item.schoolCode}_${item.majorCode}_moveDown`;

    try {
      // 设置加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: true }));

      // 调用下移API
      const response = await moveDownAlternative(item.id);

      if (response && response.code === 200) {
        // 获取当前显示的数据
        let currentData: AlternativeItem[];
        if (isManualSortMode && manualSortData.length > 0) {
          currentData = [...manualSortData];
        } else {
          currentData = getFilteredData().flatMap((group) => group.result);
        }

        const currentIndex = currentData.findIndex((i) => i.id === item.id);

        if (currentIndex < currentData.length - 1) {
          const newData = [...currentData];
          [newData[currentIndex], newData[currentIndex + 1]] = [
            newData[currentIndex + 1],
            newData[currentIndex],
          ];

          // 更新排序索引
          newData.forEach((item, index) => {
            item.sortIndex = index;
          });

          setManualSortData(newData);
          setIsManualSortMode(true);

          console.log('下移成功');
        }
      } else {
        alert(response?.message || '下移失败');
      }
    } catch (error) {
      console.error('下移失败:', error);
      alert(error instanceof Error ? error.message : '下移失败');
    } finally {
      // 清除加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  const resetManualSort = () => {
    setManualSortData([]);
    setIsManualSortMode(false);
  };

  useEffect(() => {
    // 页面初始化逻辑
    const initializePage = async () => {
      try {
        setLoading(true);
        // 已备选志愿
        const alternativesResponse = await getMajorAlternatives();

        // 处理已备选志愿数据
        if (alternativesResponse && alternativesResponse.code === 200) {
          // 服务器返回的数据结构是 { total, data, currentPage, totalPages, volunteerCount }
          const alternativesData = alternativesResponse.data.data || [];
          // 从API响应中获取志愿数量配置
          const apiVolunteerCount = alternativesResponse.data.volunteerCount;
          if (apiVolunteerCount !== undefined) {
            setVolunteerCount(apiVolunteerCount.toString());
          }

          // 从API响应中获取高发展潜能专业数量
          const apiTopDevelopmentCount = alternativesResponse.data.topDevelopmentCount;
          if (apiTopDevelopmentCount !== undefined) {
            // 将topDevelopmentCount存储到localStorage中供后续使用
            localStorage.setItem('topDevelopmentCount', apiTopDevelopmentCount.toString());
          }

          // 将 API 返回的数据转换为我们的类型
          const convertedData: AlternativeItem[] = alternativesData.map(
            (item: any, index: number) => ({
              id: item.id || `${item.schoolCode}_${item.majorCode}`,
              majorCode: item.majorCode,
              majorName: item.majorName,
              schoolCode: item.schoolCode,
              schoolName: item.schoolName,
              priority: item.priority,
              createdAt: item.createdAt,
              score: item.score,
              selected: item.selected || false,
              historyScore: item.historyScore,
              group: item.group,
              enrollmentRate: item.enrollmentRate || 0,
              employmentRate: item.employmentRate || 0,
              Rankdiff: item.Rankdiff || 0, // 位次差
              RankdiffPer: item.RankdiffPer || 0, // 位次差百分比
              // 学校标签相关属性
              schoolFeature: item.schoolFeature,
              schoolNature: item.schoolNature,
              schoolLevel: item.schoolLevel,
              majorGroupId: item.majorGroupId,
              majorGroupName: item.majorGroupName,
              schoolCity: item.schoolCity,
              sortIndex: index, // 添加排序索引
              developmentPotential: item.developmentPotential || 0, // 发展潜能
              position: item.position || 0, // 位置排序字段
            })
          );

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

          const alternativesCount = sortedAlternativesGroup.reduce(
            (acc: number, item: GroupedAlternatives) => {
              return acc + item.result.length;
            },
            0
          );
          setAlternativesCount(alternativesCount);

          // 计算已入选志愿数量
          const selectedCount = sortedAlternativesGroup.reduce(
            (acc: number, item: GroupedAlternatives) => {
              return acc + item.result.filter((alt) => alt.selected).length;
            },
            0
          );
          setSelectedCount(selectedCount);

          setAlternatives(sortedAlternativesGroup);
        }
      } catch (error) {
        console.error('页面初始化失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();

    // 检查是否需要显示提示框
    const neverShow = localStorage.getItem('volunteer-tip-never-show');
    if (!neverShow) {
      // 检查今天是否已经显示过
      const today = new Date().toDateString();
      const lastShownDate = localStorage.getItem('volunteer-tip-last-shown');
      if (lastShownDate !== today) {
        // 显示弹窗
        const timer = setTimeout(() => {
          setIsTipModalVisible(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  // 检查预警条件
  useEffect(() => {
    // 只在入选志愿页面且按自主意愿排序时检查
    if (activeTab === 'selected' && sortTab === 'willingness') {
      const requiredCount = parseInt(volunteerCount);
      const currentCount = selectedCount;

      if (currentCount < requiredCount) {
        // 检查今天是否已经显示过预警
        const today = new Date().toDateString();
        const lastShownDate = localStorage.getItem('volunteer-warning-last-shown');

        if (lastShownDate !== today) {
          // 延迟显示预警弹窗
          const timer = setTimeout(() => {
            setShowWarningModal(true);
          }, 1000);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [activeTab, sortTab, selectedCount, volunteerCount]);

  // 检查高发展潜能预警条件
  useEffect(() => {
    // 只在入选志愿页面且按专业排序时检查
    if (activeTab === 'selected' && sortTab === 'major') {
      // 从localStorage获取API返回的高发展潜能专业数量
      const apiTopDevelopmentCount = parseInt(localStorage.getItem('topDevelopmentCount') || '0');

      if (apiTopDevelopmentCount < 3) {
        // 检查今天是否已经显示过高发展潜能预警
        const today = new Date().toDateString();
        const lastShownDate = localStorage.getItem('volunteer-top-development-warning-last-shown');

        if (lastShownDate !== today) {
          // 延迟显示预警弹窗
          const timer = setTimeout(() => {
            setShowTopDevelopmentWarningModal(true);
          }, 1000);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [activeTab, sortTab]);

  // 渲染空状态提示
  const renderEmptyState = () => (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 text-center">
      <div className="mb-4">
        <div className="text-gray-400 text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">暂无志愿</h3>
        <p className="text-gray-500 text-sm mb-6">
          您还没有任何志愿，快去意向页面选择您感兴趣的院校和专业吧！
        </p>
      </div>
      <button
        onClick={() => navigate('/intention')}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        去意向页面备选
      </button>
    </div>
  );

  // 处理备选志愿点击事件 - 实现入选逻辑
  const handleAlternativeClick = async (item: AlternativeItem) => {
    const itemKey = `${item.schoolCode}_${item.majorCode}`;

    // 如果正在加载中或已经入选，直接返回
    if (loadingStatus[itemKey] || item.selected) {
      return;
    }

    // 显示入选确认对话框
    setItemToSelect(item);
    setShowSelectDialog(true);
  };

  // 处理取消入选点击事件
  const handleUnselectClick = (item: AlternativeItem) => {
    // 如果是备选志愿页面的移除按钮，直接执行移除操作
    if (activeTab === 'alternatives') {
      handleDirectUnselect(item);
    } else {
      // 如果是入选志愿页面，显示确认对话框
      setItemToUnselect(item);
      setShowUnselectDialog(true);
    }
  };

  // 直接移除入选项目（不显示确认对话框）
  const handleDirectUnselect = async (item: AlternativeItem) => {
    const itemKey = `${item.schoolCode}_${item.majorCode}_remove`;

    try {
      // 设置加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: true }));

      // 调用取消备选接口
      const response = await cancelAlternative(item.id);

      if (response && response.code === 200) {
        // 更新本地状态 - 从备选列表中完全移除该项目
        setAlternatives(
          (prevAlternatives) =>
            prevAlternatives
              .map((group) => ({
                ...group,
                result: group.result.filter((resultItem) => resultItem.id !== item.id),
              }))
              .filter((group) => group.result.length > 0) // 移除空的分组
        );

        // 更新备选数量
        setAlternativesCount((prev) => prev - 1);

        // 如果该项目已入选，也要更新入选数量
        if (item.selected) {
          setSelectedCount((prev) => prev - 1);
        }

        console.log('移除成功');
      } else {
        alert(response?.message || '移除失败');
      }
    } catch (error) {
      console.error('移除失败:', error);
      alert(error instanceof Error ? error.message : '移除失败');
    } finally {
      // 清除加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  // 确认取消入选
  const handleConfirmUnselect = async () => {
    if (!itemToUnselect) return;

    const itemKey = `${itemToUnselect.schoolCode}_${itemToUnselect.majorCode}`;

    try {
      // 设置加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: true }));

      // 调用取消备选接口
      const response = await cancelAlternative(itemToUnselect.id);

      if (response && response.code === 200) {
        // 更新本地状态 - 从备选列表中完全移除该项目
        setAlternatives(
          (prevAlternatives) =>
            prevAlternatives
              .map((group) => ({
                ...group,
                result: group.result.filter((resultItem) => resultItem.id !== itemToUnselect.id),
              }))
              .filter((group) => group.result.length > 0) // 移除空的分组
        );

        // 更新备选数量
        setAlternativesCount((prev) => prev - 1);

        // 如果该项目已入选，也要更新入选数量
        if (itemToUnselect.selected) {
          setSelectedCount((prev) => prev - 1);
        }

        console.log('移除成功');
      } else {
        alert(response?.message || '移除失败');
      }
    } catch (error) {
      console.error('移除失败:', error);
      alert(error instanceof Error ? error.message : '移除失败');
    } finally {
      // 清除加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: false }));
      // 关闭对话框
      setShowUnselectDialog(false);
      setItemToUnselect(null);
    }
  };

  // 取消取消入选操作
  const handleCancelUnselect = () => {
    setShowUnselectDialog(false);
    setItemToUnselect(null);
  };

  const scaleAnswerCount = localStorage.getItem('scaleAnswerCount');
  console.log(scaleAnswerCount, 'scaleAnswerCount');
  if (scaleAnswerCount && Number(scaleAnswerCount) !== 168) {
    return (
      <>
        <StartWelcomePage />
        <BottomNav selectedIndex={3} />
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

  const getHistoryScore = (historyScore: any) => {
    let htmlTemp = '';
    if (historyScore && historyScore.length > 0) {
      // 直接处理历史分数数据
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

      historyScore?.forEach((hs: any) => {
        for (const [key, value] of Object.entries(hs)) {
          const valueTemp = (value as string).split(',');
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
      });

      htmlTemp += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
    return htmlTemp;
  };

  // 获取当前显示的数据
  const filteredData = getFilteredData();
  const currentCount = activeTab === 'selected' ? selectedCount : alternativesCount;

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top
        title={activeTab === 'alternatives' ? '备选志愿' : '入选志愿'}
        onBack={() => window.history.back()}
      />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        {/* 页面标题和统计 */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-4 mb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              <span className="text-[22px] font-bold text-gray-900 mb-2">志愿管理</span>
            </div>
            <div className="text-blue-600 text-[22px] font-bold">共{currentCount}个</div>
          </div>
        </div>

        {/* 主Tab选项卡 */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-4 mb-3">
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
              { key: 'alternatives', label: '备选志愿', icon: '📋', color: '#2563eb' },
              { key: 'selected', label: '入选志愿', icon: '✅', color: '#10b981' },
            ].map((tab) => (
              <div
                key={tab.key}
                onClick={() => handleMainTabChange(tab.key as any)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 600,
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
                    marginRight: '8px',
                    fontSize: '18px',
                  }}
                >
                  {tab.icon}
                </span>
                {tab.label}
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '14px',
                    opacity: 0.8,
                  }}
                >
                  {tab.key === 'alternatives' ? alternativesCount : selectedCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 排序Tab选项卡 - 独立的card */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-4 mb-3">
          <div className="flex items-center mb-3">
            <span className="text-lg font-bold text-gray-900">
              {activeTab === 'selected' ? '入选志愿排序' : '排序方式'}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeTab === 'selected' ? (
              // 入选志愿的排序选项
              <>
                <button
                  onClick={() => handleSortTabChange('willingness')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortTab === 'willingness'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  按自主意愿
                </button>
                <button
                  onClick={() => handleSortTabChange('major')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortTab === 'major'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  按专业
                </button>
                <button
                  onClick={() => handleSortTabChange('rankDiff')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortTab === 'rankDiff'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  按位次差(低→高)
                </button>
              </>
            ) : (
              // 备选志愿的排序选项
              <>
                <button
                  onClick={() => handleSortTabChange('group')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortTab === 'group'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  位次段
                </button>
                <button
                  onClick={() => handleSortTabChange('enrollment')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortTab === 'enrollment'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  升学率
                </button>
                <button
                  onClick={() => handleSortTabChange('employment')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortTab === 'employment'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  就业率
                </button>
              </>
            )}
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-6 text-center">
            <div className="text-gray-500">加载中...</div>
          </div>
        )}

        {/* 志愿列表 */}
        {!loading && (
          <>
            {/* 空状态提示 */}
            {currentCount === 0 && renderEmptyState()}

            {/* 志愿列表 */}
            {currentCount > 0 &&
              filteredData.map((items) => {
                const schoolGroups = groupBySchool(items.result);

                // 每个分组只显示一个学校，其他学校需要展开（仅在位次段排序时）
                const isExpanded =
                  activeTab === 'alternatives'
                    ? expandedAlternatives[items.group]
                    : expandedSelected[items.group];
                const displaySchools =
                  sortTab === 'group' || sortTab === 'major'
                    ? isExpanded
                      ? schoolGroups
                      : schoolGroups.slice(0, 1)
                    : schoolGroups; // 按升学率和就业率排序时显示所有学校
                const hasMoreSchools = schoolGroups.length > 1 && (sortTab === 'group' || sortTab === 'major');

                return (
                  <div
                    key={items.group + 'group'}
                    className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-4"
                  >
                    {/* 在位次段排序和按专业排序时显示分组标题 */}
                    {(sortTab === 'group' || sortTab === 'major') && (
                      <div className="text-[16px] font-bold border-b pb-2 mb-2">
                        【{groupNames[items.group]}】 {items.result.length}个 &nbsp;{' '}
                        {Math.ceil((items.result.length / currentCount) * 100)} %
                      </div>
                    )}
                    {displaySchools.map((schoolGroup) => (
                      <div key={schoolGroup.schoolCode} className="mb-4">
                        {/* 学校与基本信息 */}
                        <div
                          className="flex items-center justify-between border-b pb-2 p-2 -mx-4 px-4"
                          style={{ backgroundColor: '#007bff' }}
                          onClick={() => {
                            navigate(
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
                                    navigate(
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
                                {/* 按自主意愿不显示，但在位次段和按专业排序时显示 */}
                                {activeTab !== 'selected' && (sortTab === 'group' || sortTab === 'major') && (
                                  <span className="text-yellow-600 bg-yellow-100  py-0.5 rounded text-xs ">
                                    热爱能量{Math.ceil((item.score || 0) * 100)}分！
                                  </span>
                                )}
                                {/* 显示升学率和就业率 */}
                                {(sortTab === 'enrollment' || sortTab === 'employment') && (
                                  <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs font-bold">
                                    {sortTab === 'enrollment'
                                      ? `升学率${item.enrollmentRate || 0}%`
                                      : `就业率${item.employmentRate || 0}%`}
                                  </span>
                                )}
                                {/* 显示发展潜能值 */}
                                {sortTab === 'major' && (
                                  <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded text-xs font-bold">
                                    发展潜能{Math.ceil(item.developmentPotential || 0)}分
                                  </span>
                                )}
                                {/* 显示位次差值 */}
                                {sortTab === 'rankDiff' && (
                                  <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs font-bold">
                                    位次差{item.Rankdiff || 0}
                                  </span>
                                )}
                                {/* 显示自主意愿分数 */}
                                {sortTab !== 'major' && activeTab === 'selected' && (
                                  <span className="px-2 py-0.5 rounded text-xs font-bold">
                                    较上年
                                    <span
                                      className={
                                        (item.Rankdiff || 0) > 0
                                          ? 'text-green-600 bg-green-100'
                                          : (item.Rankdiff || 0) < 0
                                            ? 'text-red-600 bg-red-100'
                                            : 'text-gray-600 bg-gray-100'
                                      }
                                    >
                                      {(item.Rankdiff || 0) > 0
                                        ? `高${item.Rankdiff}/${item.RankdiffPer}%`
                                        : (item.Rankdiff || 0) < 0
                                          ? `低${item.Rankdiff}/${item.RankdiffPer}%`
                                          : '0%'}
                                    </span>
                                  </span>
                                )}
                                {activeTab === 'alternatives' ? (
                                  <div className="flex space-x-2">
                                    <button
                                      className={`px-3 py-1 rounded ${
                                        loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : item.selected
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-green-500 text-white hover:bg-green-600'
                                      }`}
                                      onClick={() => handleAlternativeClick(item)}
                                      disabled={
                                        item.selected ||
                                        loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                                      }
                                    >
                                      {loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                                        ? '处理中...'
                                        : item.selected
                                          ? '已入选'
                                          : '入选'}
                                    </button>
                                    {/* 显示移除按钮，从备选中删除 */}
                                    <button
                                      className={`px-3 py-1 rounded ${
                                        loadingStatus[`${item.schoolCode}_${item.majorCode}_remove`]
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : 'bg-red-500 text-white hover:bg-red-600'
                                      }`}
                                      onClick={() => handleUnselectClick(item)}
                                      disabled={
                                        loadingStatus[`${item.schoolCode}_${item.majorCode}_remove`]
                                      }
                                    >
                                      {loadingStatus[`${item.schoolCode}_${item.majorCode}_remove`]
                                        ? '处理中...'
                                        : '移除'}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className={`px-3 py-1 rounded ${
                                      loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                                    onClick={() => handleUnselectClick(item)}
                                    disabled={loadingStatus[`${item.schoolCode}_${item.majorCode}`]}
                                  >
                                    {loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                                      ? '处理中...'
                                      : '移除'}
                                  </button>
                                )}
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
                              {item.enrollmentRate !== 0 && sortTab !== 'enrollment' && (
                                <span
                                  key={item.schoolName + '升学率'}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  升学率{item.enrollmentRate}%
                                </span>
                              )}
                              {/* {item.schoolLevel !== 'zhuan' && (
                                <span
                                  key={item.schoolName + '保研率'}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                >
                                  保研率{item.enrollmentRate}%
                                </span>
                              )} */}
                              {item.majorGroupId && (
                                <span
                                  key={item.schoolName + '专业组'}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"
                                >
                                  {item.majorGroupName}专业组
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
                                {item.schoolCity || '未知城市'}
                              </span>
                            </div>

                            {/* 历年分数表格 */}
                            <div
                              className="px-4 pb-4 bg-gray-50 rounded-b-lg"
                              dangerouslySetInnerHTML={{
                                __html: getHistoryScore(item?.historyScore || []),
                              }}
                            ></div>

                            {/* 手动排序按钮 - 仅在入选志愿页面且按自主意愿排序时显示 */}
                            {activeTab === 'selected' && sortTab === 'willingness' && (
                              <div className="flex justify-center space-x-2 mt-3 mb-2">
                                <button
                                  onClick={() => handleMoveUp(item)}
                                  disabled={
                                    loadingStatus[`${item.schoolCode}_${item.majorCode}_moveUp`]
                                  }
                                  className={`px-3 py-1 rounded text-xs transition-colors ${
                                    loadingStatus[`${item.schoolCode}_${item.majorCode}_moveUp`]
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-blue-500 text-white hover:bg-blue-600'
                                  }`}
                                  title="上移"
                                >
                                  {loadingStatus[`${item.schoolCode}_${item.majorCode}_moveUp`]
                                    ? '处理中...'
                                    : '⬆️ 上移'}
                                </button>
                                <button
                                  onClick={() => handleMoveDown(item)}
                                  disabled={
                                    loadingStatus[`${item.schoolCode}_${item.majorCode}_moveDown`]
                                  }
                                  className={`px-3 py-1 rounded text-xs transition-colors ${
                                    loadingStatus[`${item.schoolCode}_${item.majorCode}_moveDown`]
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-blue-500 text-white hover:bg-blue-600'
                                  }`}
                                  title="下移"
                                >
                                  {loadingStatus[`${item.schoolCode}_${item.majorCode}_moveDown`]
                                    ? '处理中...'
                                    : '⬇️ 下移'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* 展开/收起按钮 - 当分组下有多个学校时显示，且在位次段排序和按专业排序时显示 */}
                    {hasMoreSchools && (sortTab === 'group' || sortTab === 'major') && (
                      <div className="mt-2 text-center">
                        <button
                          onClick={() =>
                            activeTab === 'alternatives'
                              ? toggleAlternativesExpansion(items.group)
                              : toggleSelectedExpansion(items.group)
                          }
                          className="text-blue-600 text-sm hover:text-blue-800 transition-colors"
                        >
                          {isExpanded
                            ? '收起'
                            : `点击展开... (还有${schoolGroups.length - 1}个学校)`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav
        selectedIndex={3}
        onSelect={() => {
          window.location.href = '/educational';
        }}
      />

      {/* 取消入选确认对话框 */}
      {showUnselectDialog && itemToUnselect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">确认移除备选</h3>
              <p className="text-gray-700 mb-6">
                您确定要从备选志愿中移除{' '}
                <span className="font-bold text-blue-600">{itemToUnselect.schoolName}</span> 的{' '}
                <span className="font-bold text-blue-600">{itemToUnselect.majorName}</span> 吗？
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelUnselect}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmUnselect}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  确认移除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 入选确认对话框 */}
      {showSelectDialog && itemToSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* 对话框头部 */}
            <div className="text-center mb-6">
              <div className="text-green-500 text-4xl mb-3">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">&ldquo;入选&rdquo;确认点</h3>
              <p className="text-sm text-gray-600">请仔细确认以下信息后再入选</p>
            </div>

            {/* 院校信息卡片 */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-900 text-lg">{itemToSelect.schoolName}</h4>
                  <p className="text-blue-700 text-sm">{itemToSelect.majorName}</p>
                </div>
                <div className="text-right">
                  <div className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-bold">
                    热爱能量{Math.ceil((itemToSelect.score || 0) * 100)}分
                  </div>
                </div>
              </div>
            </div>

            {/* 确认选项 */}
            <div className="space-y-4 mb-6">
              {/* 选项1：招生要求确认 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectConfirmations.requirement}
                    onChange={(e) =>
                      handleSelectConfirmationChange('requirement', e.target.checked)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      1. 确认符合该院校本专业招生要求
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      该校承诺对服从调剂且满足招生要求的考生&ldquo;进档不退档&rdquo;，退档风险低
                    </p>
                  </div>
                </div>
              </div>

              {/* 选项2：升学就业信息确认 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectConfirmations.enrollment}
                    onChange={(e) => handleSelectConfirmationChange('enrollment', e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      2. 院校近几年升研率、保研率及今年招生人数、招生校区均已确认
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      符合报考意愿，升学就业前景良好
                    </p>
                  </div>
                </div>
              </div>

              {/* 选项3：专业组确认 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectConfirmations.majorGroup}
                    onChange={(e) => handleSelectConfirmationChange('majorGroup', e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      3. 已仔细查看组内所有专业发展潜能值
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      即使被调剂，也均为可接受专业
                    </p>
                    {itemToSelect.majorGroupId && (
                      <button
                        onClick={handleViewMajorGroup}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        <span className="mr-1">查看专业组</span>
                        <span className="text-xs">
                          {'>'}
                          {'>'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={handleCancelSelect}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSelect}
                disabled={!isAllConfirmed}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isAllConfirmed
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                确认入选
              </button>
            </div>

            {/* 提示信息 */}
            {!isAllConfirmed && (
              <div className="mt-4 text-center">
                <p className="text-sm text-orange-600">⚠️ 请确认所有选项后再入选</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 提示弹窗 */}
      <Modal
        title={
          <div
            style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}
          >
            💡 志愿管理说明
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
          <div
            style={{
              padding: '16px 0',
              lineHeight: '1.8',
              fontSize: '14px',
              color: '#333',
            }}
          >
            <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2563eb' }}>
              1.点击&ldquo;入选&rdquo;后，该院校及专业信息自动进入&ldquo;志愿表&rdquo;；
            </div>
            <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2563eb' }}>
              2.点击&ldquo;移除&rdquo;后，该院校及专业信息将不再出现在&ldquo;备选志愿&rdquo;频道，如果想重新备选，需进入&ldquo;意向&rdquo;频道进行操作。
            </div>
          </div>

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
        style={{ top: '20%' }}
      >
        <div className="p-4">
          {majorGroupLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : majorGroupData.length === 0 ? (
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

      {/* 预警弹窗 */}
      <Modal
        title={
          <div
            style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}
          >
            ⚠️ 志愿填报预警
          </div>
        }
        open={showWarningModal}
        onCancel={handleWarningModalClose}
        footer={null}
        width={400}
        centered
        className="rounded-2xl"
        style={{ top: '20%' }}
      >
        <div style={{ padding: '20px 0' }}>
          <div
            style={{
              padding: '16px 0',
              lineHeight: '1.8',
              fontSize: '14px',
              color: '#333',
            }}
          >
            <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#dc2626' }}>
              预警：您合计需填报{volunteerCount}个志愿，已确定{selectedCount}个，尚需确认
              {parseInt(volunteerCount) - selectedCount}个。
            </div>
            <div style={{ marginBottom: '12px', color: '#666' }}>
              请及时补充入选志愿，确保志愿填报的完整性。
            </div>
          </div>

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
              请选择您的偏好：
            </div>
            <div>
              <Checkbox
                checked={warningChoices.todayNotShow}
                onChange={(e) => handleWarningChoiceChange(e.target.checked)}
                style={{ fontSize: '13px' }}
              >
                今天不显示此预警
              </Checkbox>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Button
              type="primary"
              onClick={handleWarningModalConfirm}
              style={{
                background: '#dc2626',
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

      {/* 高发展潜能预警弹窗 */}
      <Modal
        title={
          <div
            style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}
          >
            ⚠️ 高发展潜能专业预警
          </div>
        }
        open={showTopDevelopmentWarningModal}
        onCancel={handleTopDevelopmentWarningModalClose}
        footer={null}
        width={400}
        centered
        className="rounded-2xl"
        style={{ top: '20%' }}
      >
        <div style={{ padding: '20px 0' }}>
          <div
            style={{
              padding: '16px 0',
              lineHeight: '1.8',
              fontSize: '14px',
              color: '#333',
            }}
          >
            <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#dc2626' }}>预警：</div>
            <div style={{ marginBottom: '12px', color: '#666', lineHeight: '1.6' }}>
              1.志愿表中&ldquo;高发展潜能专业&rdquo;低于3个，建议增加，避免个别专业当年报考热度太高导致滑档；
            </div>
          </div>

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
              请选择您的偏好：
            </div>
            <div>
              <Checkbox
                checked={topDevelopmentWarningChoices.todayNotShow}
                onChange={(e) => handleTopDevelopmentWarningChoiceChange(e.target.checked)}
                style={{ fontSize: '13px' }}
              >
                今天不显示此预警
              </Checkbox>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Button
              type="primary"
              onClick={handleTopDevelopmentWarningModalConfirm}
              style={{
                background: '#dc2626',
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

export default EducationalPage;
