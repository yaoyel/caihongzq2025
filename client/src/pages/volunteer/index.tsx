import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Checkbox, Input } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';

import BottomNav from '../comm/bottom';
import StartWelcomePage from '../selfassessment/startWelcome';
import CommonSelect, { SelectOptionData } from '../comm/CommonSelect';
import {
  getMajorAlternatives,
  selectAlternative,
  cancelAlternative,
  getMajorGroup,
  moveUpAlternative,
  moveDownAlternative,
  getSchoolCharters,
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
  enrollmentRate?: number; // 按专业
  employmentRate?: number; // 按位次差(低→高)
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

// 定义招生简章信息类型
interface CharterItem {
  id: string;
  title: string; // 简章标题
  content: string; // 简章内容
  year: number; // 年份
  schoolCode: string; // 学校代码
  schoolName: string; // 学校名称
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
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

const EducationalPage: React.FC = () => {
  const navigate = useNavigate();
  const [alternatives, setAlternatives] = useState<GroupedAlternatives[]>([]);
  // 添加原始数据状态，用于保存初始的备选志愿数据
  const [originalAlternatives, setOriginalAlternatives] = useState<GroupedAlternatives[]>([]);
  const [alternativesCount, setAlternativesCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0); // 添加入选志愿数量
  const [loading, setLoading] = useState(true); // 添加加载状态

  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({}); // 添加按钮加载状态

  // 透明浮层提示状态

  // 主Tab状态 - 控制志愿显示方式
  const [activeTab, setActiveTab] = useState<'alternatives' | 'selected'>('alternatives');

  // 排序Tab状态 - 控制排序方式
  const [sortTab, setSortTab] = useState<'willingness' | 'major' | 'rankDiff'>('willingness');

  const [showFloatingTip, setShowFloatingTip] = useState(true); // 默认显示浮层提示

  // 添加入选确认对话框状态
  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const [itemToSelect, setItemToSelect] = useState<AlternativeItem | null>(null);
  const [selectConfirmations, setSelectConfirmations] = useState({
    requirement: false,
    enrollment: false,
    riskControl: false, // 退档风险控制
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

  // 添加招生简章弹窗状态
  const [showChartersDialog, setShowChartersDialog] = useState(false);
  const [chartersData, setChartersData] = useState<CharterItem[]>([]);
  const [chartersLoading, setChartersLoading] = useState(false);
  const [currentSchoolInfo, setCurrentSchoolInfo] = useState<{
    schoolCode: string;
    schoolName: string;
  } | null>(null);

  // 获取志愿数量配置
  const [volunteerCount, setVolunteerCount] = useState(6); // 默认6个志愿

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

  // 添加新的分组数据状态
  // 发展潜能选择相关状态
  const [selectedDevelopmentGroup, setSelectedDevelopmentGroup] = useState<string>();
  const [selectedRankGroup, setSelectedRankGroup] = useState<string>();
  const [developmentOptions, setDevelopmentOptions] = useState<SelectOptionData[]>([]);
  const [groupedByDevelopmentPotential, setGroupedByDevelopmentPotential] = useState<any[]>([]);
  const [groupedByRankDiffPer, setGroupedByRankDiffPer] = useState<any[]>([]);
  const [topDevelopmentMajors, setTopDevelopmentMajors] = useState<any[]>([]);
  const [bottomDevelopmentMajors, setBottomDevelopmentMajors] = useState<any[]>([]);
  const [rankOptions, setRankOptions] = useState<SelectOptionData[]>([]);
  // 按API顺序选择相关状态
  const [rankFilterOptions, setRankFilterOptions] = useState<SelectOptionData[]>([]);
  // 学校性质过滤相关状态
  const [selectedSchoolNature, setSelectedSchoolNature] = useState<string>('all');
  // 升学率过滤相关状态
  const [selectedEnrollmentRate, setSelectedEnrollmentRate] = useState<string>('all');
  // 就业率过滤相关状态
  const [selectedEmploymentRate, setSelectedEmploymentRate] = useState<string>('all');
  // 分别为备选志愿和入选志愿管理展开状态
  const [expandedAlternatives, setExpandedAlternatives] = useState<{ [key: number]: boolean }>({});
  const [expandedSelected, setExpandedSelected] = useState<{ [key: number]: boolean }>({});

  // 添加专业分组的展开状态管理 - 默认全部展开
  const [expandedMajorGroups, setExpandedMajorGroups] = useState<{ [key: string]: boolean }>({});

  // 添加取消入选确认对话框状态
  const [showUnselectDialog, setShowUnselectDialog] = useState(false);
  const [itemToUnselect, setItemToUnselect] = useState<AlternativeItem | null>(null);

  // 检查是否所有确认项都已选中
  // 添加搜索相关状态
  const [searchText, setSearchText] = useState('');
  const [showSearchTips, setShowSearchTips] = useState(false);

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
        riskControl: false,
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
      riskControl: false,
      majorGroup: false,
    });
  };

  // 查看专业组详情
  // 通用的专业组查看函数
  const handleViewMajorGroup = async (item?: AlternativeItem) => {
    const targetItem = item || itemToSelect;
    if (targetItem?.majorGroupId) {
      try {
        setMajorGroupLoading(true);
        setCurrentMajorGroupInfo({
          majorGroupId: targetItem.majorGroupId,
          majorGroupName: targetItem.majorGroupName || '',
          schoolName: targetItem.schoolName,
        });

        // 调用专业组API
        const response = await getMajorGroup(targetItem.majorGroupId);

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

  // 查看招生简章
  const handleViewCharters = async () => {
    if (itemToSelect?.schoolCode) {
      try {
        setChartersLoading(true);
        setCurrentSchoolInfo({
          schoolCode: itemToSelect.schoolCode,
          schoolName: itemToSelect.schoolName,
        });

        // 调用招生简章API
        const response = await getSchoolCharters(itemToSelect.schoolCode);

        if (response && response.code === 200) {
          setChartersData(response.data || []);
          setShowChartersDialog(true);
        } else {
          alert(response?.message || '获取招生简章失败');
        }
      } catch (error) {
        console.error('获取招生简章失败:', error);
        alert(error instanceof Error ? error.message : '获取招生简章失败');
      } finally {
        setChartersLoading(false);
      }
    }
  };

  // 关闭招生简章弹窗
  const handleCloseChartersDialog = () => {
    setShowChartersDialog(false);
    setChartersData([]);
    setCurrentSchoolInfo(null);
  };

  const groupNames = [
    '其他按API顺序院校',
    '（+5%）到（+30%）按API顺序院校',
    '（-10%）到+（+5%）按API顺序院校',
    '（-30%） 到 （-10%）按API顺序院校',
  ];

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

  // 按专业分组并按按API顺序分组学校
  const groupByMajorAndRank = (items: AlternativeItem[]): MajorGroup[] => {
    const majorGroups = groupByMajor(items);

    return majorGroups.map((majorGroup) => {
      // 按按API顺序分组学校
      const rankGroups = new Map<number, AlternativeItem[]>();

      majorGroup.result.forEach((item) => {
        const group = item.group || 0;
        if (!rankGroups.has(group)) {
          rankGroups.set(group, []);
        }
        rankGroups.get(group)!.push(item);
      });

      // 按指定顺序[2,3,1,0]组织按API顺序，每个按API顺序包含该按API顺序下的所有学校
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

          // 创建学校组，每个学校组包含该按API顺序下的所有专业
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
        .filter((rankGroup) => rankGroup.schools.length > 0); // 只保留有学校的按API顺序

      return {
        majorCode: majorGroup.majorCode,
        majorName: majorGroup.majorName,
        schools: [], // 保持兼容性，但实际使用rankGroups
        rankGroups: orderedRankGroups,
        isExpanded: false,
      };
    });
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
      // 如果当前是"按自主意愿"排序，切换到"按API顺序"排序
      if (sortTab === 'willingness') {
        setSortTab('willingness');
      } else {
        setSortTab('willingness'); // 备选志愿默认按API顺序
      }
    }
  };

  // 处理排序Tab切换
  const handleSortTabChange = (tab: 'willingness' | 'major' | 'rankDiff') => {
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
        case 'willingness': {
          if (activeTab === 'selected') {
            // 入选志愿按自主意愿排序
            return data.sort((a, b) => {
              const aScore = a.result[0]?.score || 0;
              const bScore = b.result[0]?.score || 0;
              return bScore - aScore;
            });
          } else {
            return data; // 在备选志愿页面，直接返回API数据，保持原始顺序
          }
        }
        case 'major': {
          // 按专业分组
          const majorGroups = groupByMajorAndRank(data.flatMap((group) => group.result));
          return majorGroups.map((majorGroup) => ({
            group: -1000 - parseInt(majorGroup.majorCode),
            result:
              majorGroup.rankGroups?.flatMap((rankGroup) =>
                rankGroup.schools.flatMap((school) => school.majors)
              ) || [],
            majorGroup,
          }));
        }
        case 'rankDiff': {
          // 按位次差排序
          return data.sort((a, b) => {
            const aRankDiff = a.result[0]?.Rankdiff || 0;
            const bRankDiff = b.result[0]?.Rankdiff || 0;
            return aRankDiff - bRankDiff;
          });
        }
        default: {
          // 默认 按API返回顺序显示
          return data;
        }
      }
    },
    [sortTab, activeTab, isManualSortMode, manualSortData]
  );
  // 添加搜索过滤逻辑
  const filterDataBySearch = useCallback(
    (data: AlternativeItem[]) => {
      const filteredData = data.filter((item) => {
        // 搜索文本过滤
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          searchText === '' ||
          item.schoolName.toLowerCase().includes(searchLower) ||
          item.majorName.toLowerCase().includes(searchLower) ||
          item.majorCode.toLowerCase().includes(searchLower) ||
          getCityDisplayInfo(item).toLowerCase().includes(searchLower) ||
          (item.provinceName && item.provinceName.toLowerCase().includes(searchLower));

        return matchesSearch;
      });

      return filteredData;
    },
    [searchText]
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

      const sortedData = getSortedData(selectedData) || [];

      // 应用搜索过滤
      return sortedData
        .map((group) => ({
          ...group,
          result: filterDataBySearch(group.result),
        }))
        .filter((group) => group.result.length > 0);
    } else {
      // 备选志愿页面显示所有备选志愿
      const sortedData = getSortedData(alternatives) || [];

      // 应用搜索过滤
      return sortedData
        .map((group) => ({
          ...group,
          result: filterDataBySearch(group.result),
        }))
        .filter((group) => group.result.length > 0);
    }
  }, [alternatives, activeTab, getSortedData, filterDataBySearch]);

  // 确保getFilteredData总是返回一个数组
  const safeGetFilteredData = useCallback(() => {
    const result = getFilteredData();
    return result || [];
  }, [getFilteredData]);
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
          currentData = safeGetFilteredData().flatMap((group) => group.result);
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
          currentData = safeGetFilteredData().flatMap((group) => group.result);
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

  // 处理发展潜能选择
  const handleDevelopmentSelect = useCallback(
    (groupId: string) => {
      setSelectedDevelopmentGroup(groupId);

      // 根据选中的分组过滤数据
      if (groupedByDevelopmentPotential && groupedByDevelopmentPotential.length > 0) {
        const selectedGroup = groupedByDevelopmentPotential.find(
          (group: any) => group.groupId === groupId
        );
        if (selectedGroup && selectedGroup.majorCodes) {
          // 基于原始数据进行过滤
          const filteredAlternatives = originalAlternatives
            .map((group) => ({
              ...group,
              result: group.result.filter((item) =>
                selectedGroup.majorCodes.includes(item.majorCode)
              ),
            }))
            .filter((group) => group.result.length > 0);

          setAlternatives(filteredAlternatives);
          return;
        }
      }
    },
    [originalAlternatives, groupedByDevelopmentPotential] // 依赖改为 originalAlternatives
  );

  // 清除发展潜能选择
  const handleDevelopmentClear = useCallback(() => {
    setSelectedDevelopmentGroup(undefined); // 重新加载原始数据
    // 恢复原始数据，而不是重新加载页面
    setAlternatives(originalAlternatives);
  }, [originalAlternatives]);

  // 处理位次段选择
  const handleRankSelect = useCallback(
    (groupId: string) => {
      setSelectedRankGroup(groupId);

      // 根据选中的分组过滤数据
      if (groupedByRankDiffPer && groupedByRankDiffPer.length > 0) {
        const selectedGroup = groupedByRankDiffPer.find((group: any) => group.groupId === groupId);
        console.log('selectedGroup', selectedGroup);
        console.log('groupedByRankDiffPer', groupedByRankDiffPer);
        if (selectedGroup && selectedGroup.alternativeIds) {
          // 基于原始数据进行过滤，而不是当前的 alternatives
          const filteredAlternatives = originalAlternatives
            .map((group) => ({
              ...group,
              result: group.result.filter((item) =>
                selectedGroup.alternativeIds.includes(parseInt(item.id))
              ),
            }))
            .filter((group) => group.result.length > 0);
          console.log('filteredAlternatives', filteredAlternatives);
          console.log('original alternatives', originalAlternatives);
          setAlternatives(filteredAlternatives);
          return;
        }
      }
    },
    [originalAlternatives, groupedByRankDiffPer] // 依赖改为 originalAlternatives
  );

  // 清除位次段选择
  const handleRankClear = useCallback(() => {
    setSelectedRankGroup(undefined);
    // 恢复原始数据，而不是重新加载页面
    setAlternatives(originalAlternatives);
  }, [originalAlternatives]);

  // 处理学校性质选择
  const handleSchoolNatureSelect = useCallback(
    (nature: string) => {
      setSelectedSchoolNature(nature);

      // 根据选中的学校性质过滤数据
      if (nature === 'all') {
        // 显示所有数据
        setAlternatives(originalAlternatives);
      } else {
        // 基于原始数据进行过滤
        const filteredAlternatives = originalAlternatives
          .map((group) => ({
            ...group,
            result: group.result.filter((item) => {
              if (nature === 'public') {
                return item.schoolNature === 'public';
              } else if (nature === 'private') {
                return item.schoolNature === 'private';
              }
              return true;
            }),
          }))
          .filter((group) => group.result.length > 0);

        setAlternatives(filteredAlternatives);
      }
    },
    [originalAlternatives]
  );
  useEffect(() => {
    // 页面初始化逻辑
    const initializePage = async () => {
      try {
        setLoading(true);
        // 已备选志愿
        const alternativesResponse = await getMajorAlternatives();

        // 处理已备选志愿数据
        if (alternativesResponse && alternativesResponse.code === 200) {
          // 服务器返回的数据结构是 { total, alternatives, currentPage, totalPages, volunteerCount, groupedByDevelopmentPotential, groupedByRankDiffPer, topDevelopmentMajors }
          const alternativesData = alternativesResponse.data.alternatives || [];

          // 从API响应中获取志愿数量配置
          const apiVolunteerCount = alternativesResponse.data.volunteerCount;
          if (apiVolunteerCount !== undefined) {
            setVolunteerCount(apiVolunteerCount);
          }

          // 从API响应中获取高发展潜能专业数量
          const apiTopDevelopmentCount = alternativesResponse.data.topDevelopmentCount;
          if (apiTopDevelopmentCount !== undefined) {
            // 将topDevelopmentCount存储到localStorage中供后续使用
            localStorage.setItem('topDevelopmentCount', apiTopDevelopmentCount.toString());
          }

          // 处理新的分组数据
          if (alternativesResponse.data.groupedByDevelopmentPotential) {
            setGroupedByDevelopmentPotential(
              alternativesResponse.data.groupedByDevelopmentPotential
            );
          }
          if (alternativesResponse.data.groupedByRankDiffPer) {
            setGroupedByRankDiffPer(alternativesResponse.data.groupedByRankDiffPer);
          }
          if (alternativesResponse.data.topDevelopmentMajors) {
            setTopDevelopmentMajors(alternativesResponse.data.topDevelopmentMajors);
          }
          if (alternativesResponse.data.bottomDevelopmentMajors) {
            setBottomDevelopmentMajors(alternativesResponse.data.bottomDevelopmentMajors);
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
              provinceName: item.provinceName,
              cityName: item.cityName,
              sortIndex: index, // 添加排序索引
              developmentPotential: item.developmentPotential || 0, // 发展潜能
              position: item.position || 0, // 位置排序字段
              // 招生信息相关属性
              admissionsSite: item.admissionsSite,
              admissionsPhone: item.admissionsPhone,
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
          setOriginalAlternatives(sortedAlternativesGroup); // 保存原始数据
        }
        // 初始化发展潜能选择器选项
        if (alternativesResponse.data.groupedByDevelopmentPotential) {
          const optionsData = alternativesResponse.data.groupedByDevelopmentPotential.map(
            (group: any) => ({
              id: group.groupId,
              label: group.description,
              count: group.count,
            })
          );
          setDevelopmentOptions(optionsData);
        }

        // 初始化按API顺序选择器选项
        if (alternativesResponse.data.groupedByRankDiffPer) {
          const rankOptionsData = alternativesResponse.data.groupedByRankDiffPer.map(
            (group: any) => ({
              id: group.groupId,
              label: group.description,
              count: group.count,
            })
          );
          setRankOptions(rankOptionsData);
          setRankFilterOptions(rankOptionsData);
        }
      } catch (error) {
        console.error('页面初始化失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);
  // 检查预警条件
  useEffect(() => {
    // 只在备选志愿页面且按按API顺序排序时检查
    if (activeTab === 'alternatives' && sortTab === 'willingness') {
      const requiredCount = volunteerCount;
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
    // 只在备选志愿页面且按专业排序时检查
    if (activeTab === 'alternatives' && sortTab === 'major') {
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
    <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 text-center mt-5">
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
  const filteredData = safeGetFilteredData();
  const currentCount = activeTab === 'selected' ? selectedCount : alternativesCount;
  // 计算备选志愿预警信息
  const calculateWarnings = useCallback(() => {
    if (activeTab !== 'alternatives') return [];

    const warnings: Array<{
      type: 'major-count' | 'top-development' | 'bottom-development';
      level: 'warning' | 'danger';
      title: string;
      content: string;
      majors?: string[];
    }> = [];

    // 获取所有备选志愿的专业数据
    const allMajors = alternatives.flatMap(group => group.result);
    const majorCount = allMajors.length;

    // 1. 合计专业数预警
    if (majorCount < 5) {
      warnings.push({
        type: 'major-count',
        level: 'warning',
        title: '合计专业数：⚠️偏少',
        content: '建议增加至5个以上，避免某些专业当年过热、录取线大幅上升导致的滑档风险！'
      });
    }

    // 2. 发展潜能前20%专业预警 - 使用API返回的topDevelopmentMajors
    if (allMajors.length > 0 && topDevelopmentMajors && topDevelopmentMajors.length > 0) {
      // 获取当前备选专业中属于前20%发展潜能专业的数量
      const topDevelopmentCount = allMajors.filter(item => 
        topDevelopmentMajors.some(topMajor => 
          topMajor.schoolCode === item.schoolCode && topMajor.majorCode === item.majorCode
        )
      ).length;
      
      const topDevelopmentRatio = topDevelopmentCount / allMajors.length;
      
      if (topDevelopmentRatio < 0.8) {
        warnings.push({
          type: 'top-development',
          level: 'warning',
          title: '发展潜能前20%专业：⚠️偏少',
          content: '建议80%以上志愿均属于发展潜能前20%专业，降低未来发展风险！'
        });
      }
    }

      // 3. 发展潜能后20%专业预警 - 使用API返回的数据
      if (bottomDevelopmentMajors && bottomDevelopmentMajors.length > 0) {
        // 找出当前备选志愿中属于后20%专业的项目
        const bottomMajorsInAlternatives = allMajors.filter(item => 
          bottomDevelopmentMajors.some((bottomMajor: any) => 
            bottomMajor.majorCode === item.majorCode
          )
        );
        
        if (bottomMajorsInAlternatives.length > 0) {
          const majorNames = bottomMajorsInAlternatives.map(item => item.majorName).slice(0, 3);
          warnings.push({
            type: 'bottom-development',
            level: 'danger',
            title: '发展潜能后20%专业：⚠️高风险预警',
            content: `${majorNames.join('、')}${bottomMajorsInAlternatives.length > 3 ? '等' : ''}专业均属于发展潜能后20%专业，如无非常特殊的原因，不建议考虑，避免未来发展风险！`,
            majors: majorNames
          });
        }
      }
    return warnings;
  }, [alternatives, activeTab, topDevelopmentMajors, bottomDevelopmentMajors]);

  const warningData = calculateWarnings();
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

  // 处理升学率选择
  const handleEnrollmentRateSelect = useCallback(
    (rate: string) => {
      setSelectedEnrollmentRate(rate);

      // 根据选中的升学率过滤数据
      if (rate === 'all') {
        // 显示所有数据
        setAlternatives(originalAlternatives);
      } else {
        // 基于原始数据进行过滤
        const filteredAlternatives = originalAlternatives
          .map((group) => ({
            ...group,
            result: group.result.filter((item) => {
              const enrollmentRate = item.enrollmentRate || 0;
              if (rate === 'top50') {
                return enrollmentRate >= 50;
              } else if (rate === 'bottom50') {
                return enrollmentRate < 50;
              }
              return true;
            }),
          }))
          .filter((group) => group.result.length > 0);

        setAlternatives(filteredAlternatives);
      }
    },
    [originalAlternatives]
  );

  // 处理就业率选择
  const handleEmploymentRateSelect = useCallback(
    (rate: string) => {
      setSelectedEmploymentRate(rate);

      // 根据选中的就业率过滤数据
      if (rate === 'all') {
        // 显示所有数据
        setAlternatives(originalAlternatives);
      } else {
        // 基于原始数据进行过滤
        const filteredAlternatives = originalAlternatives
          .map((group) => ({
            ...group,
            result: group.result.filter((item) => {
              const employmentRate = item.employmentRate || 0;
              if (rate === 'top50') {
                return employmentRate >= 50;
              } else if (rate === 'bottom50') {
                return employmentRate < 50;
              }
              return true;
            }),
          }))
          .filter((group) => group.result.length > 0);

        setAlternatives(filteredAlternatives);
      }
    },
    [originalAlternatives]
  );

  useEffect(() => {
    // 页面初始化逻辑
    const initializePage = async () => {
      try {
        setLoading(true);
        // 已备选志愿
        const alternativesResponse = await getMajorAlternatives();

        // 处理已备选志愿数据
        if (alternativesResponse && alternativesResponse.code === 200) {
          // 服务器返回的数据结构是 { total, alternatives, currentPage, totalPages, volunteerCount, groupedByDevelopmentPotential, groupedByRankDiffPer, topDevelopmentMajors }
          const alternativesData = alternativesResponse.data.alternatives || [];

          // 从API响应中获取志愿数量配置
          const apiVolunteerCount = alternativesResponse.data.volunteerCount;
          if (apiVolunteerCount !== undefined) {
            setVolunteerCount(apiVolunteerCount);
          }

          // 从API响应中获取高发展潜能专业数量
          const apiTopDevelopmentCount = alternativesResponse.data.topDevelopmentCount;
          if (apiTopDevelopmentCount !== undefined) {
            // 将topDevelopmentCount存储到localStorage中供后续使用
            localStorage.setItem('topDevelopmentCount', apiTopDevelopmentCount.toString());
          }

          // 处理新的分组数据
          if (alternativesResponse.data.groupedByDevelopmentPotential) {
            setGroupedByDevelopmentPotential(
              alternativesResponse.data.groupedByDevelopmentPotential
            );
          }
          if (alternativesResponse.data.groupedByRankDiffPer) {
            setGroupedByRankDiffPer(alternativesResponse.data.groupedByRankDiffPer);
          }
          if (alternativesResponse.data.topDevelopmentMajors) {
            setTopDevelopmentMajors(alternativesResponse.data.topDevelopmentMajors);
          }
          if (alternativesResponse.data.bottomDevelopmentMajors) {
            setBottomDevelopmentMajors(alternativesResponse.data.bottomDevelopmentMajors);
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
              provinceName: item.provinceName,
              cityName: item.cityName,
              sortIndex: index, // 添加排序索引
              developmentPotential: item.developmentPotential || 0, // 发展潜能
              position: item.position || 0, // 位置排序字段
              // 招生信息相关属性
              admissionsSite: item.admissionsSite,
              admissionsPhone: item.admissionsPhone,
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
          setOriginalAlternatives(sortedAlternativesGroup); // 保存原始数据
        }
        // 初始化发展潜能选择器选项
        if (alternativesResponse.data.groupedByDevelopmentPotential) {
          const optionsData = alternativesResponse.data.groupedByDevelopmentPotential.map(
            (group: any) => ({
              id: group.groupId,
              label: group.description,
              count: group.count,
            })
          );
          setDevelopmentOptions(optionsData);
        }

        // 初始化按API顺序选择器选项
        if (alternativesResponse.data.groupedByRankDiffPer) {
          const rankOptionsData = alternativesResponse.data.groupedByRankDiffPer.map(
            (group: any) => ({
              id: group.groupId,
              label: group.description,
              count: group.count,
            })
          );
          setRankOptions(rankOptionsData);
          setRankFilterOptions(rankOptionsData);
        }
      } catch (error) {
        console.error('页面初始化失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);
  // 检查预警条件
  useEffect(() => {
    // 只在备选志愿页面且按按API顺序排序时检查
    if (activeTab === 'alternatives' && sortTab === 'willingness') {
      const requiredCount = volunteerCount;
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
    // 只在备选志愿页面且按专业排序时检查
    if (activeTab === 'alternatives' && sortTab === 'major') {
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

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 50 }}>
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
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'alternatives'
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleMainTabChange('alternatives')}
            >
              备选志愿{' '}
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {alternativesCount}
              </span>
            </button>
            <button
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'selected'
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleMainTabChange('selected')}
            >
              入选志愿{' '}
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {selectedCount}
              </span>
            </button>
          </div>
          <div className="flex items-right "></div>
        </div>
      </div>

      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        {/* 排序Tab选项卡 - 独立的card */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-4 mb-0">
          <div className="flex gap-2 flex-wrap">
            {activeTab === 'selected' ? (
              // 入选志愿的排序选项
              <>
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
                {/* 发展潜能选择器 - 仅在入选志愿页面显示 */}
                {developmentOptions && developmentOptions.length > 0 && (
                  <div className="w-full max-w-xl  p-2">
                    <CommonSelect
                      data={developmentOptions}
                      placeholder="选择发展潜能范围"
                      onSelect={handleDevelopmentSelect}
                      onClear={handleDevelopmentClear}
                      allowClear={true}
                      showCount={true}
                      width="100%"
                    />
                  </div>
                )}

                {/* 搜索组件 - 在入选志愿页面也显示 */}
                <div className="w-full max-w-xl p-1">
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
                </div>

                {/* 学校性质过滤 - 在入选志愿页面也显示 */}
                <div className="w-full max-w-xl p-1">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      学校性质：
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSchoolNatureSelect('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedSchoolNature === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        全部
                      </button>
                      <button
                        onClick={() => handleSchoolNatureSelect('public')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedSchoolNature === 'public' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        公办
                      </button>
                      <button
                        onClick={() => handleSchoolNatureSelect('private')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedSchoolNature === 'private' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        民办
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              rankFilterOptions &&
              rankFilterOptions.length > 0 && (
                <>
                {/* 位次段过滤 */}
                  <div className="w-full max-w-xl p-1">
                    <CommonSelect
                      data={rankFilterOptions}
                      placeholder="选择位次段范围"
                      onSelect={handleRankSelect}
                      onClear={handleRankClear}
                      allowClear={true}
                      showCount={true}
                      width="100%"
                    />
                  </div>
                  {/* 升学率过滤 */}
                  <div className="w-full max-w-xl p-1">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        升学率：
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEnrollmentRateSelect('all')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedEnrollmentRate === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          全部
                        </button>
                        <button
                          onClick={() => handleEnrollmentRateSelect('top50')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedEnrollmentRate === 'top50' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          前50%
                        </button>
                        <button
                          onClick={() => handleEnrollmentRateSelect('bottom50')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedEnrollmentRate === 'bottom50' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          后50%
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* 就业率过滤 */}
                  <div className="w-full max-w-xl p-1">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        就业率：
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEmploymentRateSelect('all')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedEmploymentRate === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          全部
                        </button>
                        <button
                          onClick={() => handleEmploymentRateSelect('top50')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedEmploymentRate === 'top50' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          前50%
                        </button>
                        <button
                          onClick={() => handleEmploymentRateSelect('bottom50')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedEmploymentRate === 'bottom50' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          后50%
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* 搜索组件 */}
                  <div className="w-full max-w-xl p-1">
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
                  </div>
                  {/* 学校性质过滤 */}
                  <div className="w-full max-w-xl p-1">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        学校性质：
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSchoolNatureSelect('all')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedSchoolNature === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          全部
                        </button>
                        <button
                          onClick={() => handleSchoolNatureSelect('public')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedSchoolNature === 'public' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          公办
                        </button>
                        <button
                          onClick={() => handleSchoolNatureSelect('private')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedSchoolNature === 'private' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          民办
                        </button>
                      </div>
                    </div>
                  </div>{' '}
                </>
              )
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
            {/* 预警信息显示 - 仅在备选志愿tab显示 */}
            {activeTab === 'alternatives' && warningData.length > 0 && (
              <div className="w-full max-w-xl space-y-3 mb-3">
                {warningData.map((warning, index) => (
                  <div
                    key={`warning-${warning.type}-${index}`}
                    className={`rounded-2xl shadow p-4 ${
                      warning.level === 'danger'
                        ? 'bg-red-50 border-l-4 border-red-500 mt-3'
                        : 'bg-orange-50 border-l-4 border-orange-500 mt-2'
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                          warning.level === 'danger'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        <span className="text-sm font-bold">!</span>
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-bold text-sm mb-1 ${
                            warning.level === 'danger' ? 'text-red-800' : 'text-orange-800'
                          }`}
                        >
                          {warning.title}
                        </h4>
                        <p
                          className={`text-sm leading-relaxed ${
                            warning.level === 'danger' ? 'text-red-700' : 'text-orange-700'
                          }`}
                        >
                          {warning.content}
                        </p>
                        {warning.majors && warning.majors.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {warning.majors.map((major, majorIndex) => (
                              <span
                                key={`major-${majorIndex}`}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  warning.level === 'danger'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {major}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 空状态提示 */}
            {currentCount === 0 && renderEmptyState()}

            {/* 志愿列表 */}
            {currentCount > 0 &&
              filteredData.map((items) => {
                // 检查是否为按专业分组的数据
                const isMajorGroup = items.group <= -1000;

                let schoolGroups: SchoolGroup[];
                let rankGroups: any[] = [];

                if (isMajorGroup) {
                  // 按专业分组的数据
                  const majorGroup = (items as any).majorGroup as MajorGroup;
                  rankGroups = majorGroup.rankGroups || [];
                  schoolGroups = rankGroups.flatMap((rankGroup) => rankGroup.schools);
                } else {
                  // 按按API顺序分组的数据
                  schoolGroups = groupBySchool(items.result);
                }

                // 每个分组只显示一个学校，其他学校需要展开（仅在按API顺序排序时）
                const isExpanded =
                  activeTab === 'alternatives'
                    ? expandedAlternatives[items.group]
                    : expandedSelected[items.group];

                // 对于按专业分组的数据，使用专业代码作为展开状态的key
                const majorGroupExpanded = isMajorGroup
                  ? expandedMajorGroups[`${(items as any).majorGroup.majorCode}`]
                  : isExpanded;

                const displaySchools = schoolGroups; // 按按专业和按位次差(低→高)排序时显示所有学校
                const hasMoreSchools =
                  schoolGroups.length > 1 && (sortTab === 'willingness' || sortTab === 'major');

                return (
                  <div
                    key={items.group + 'group'}
                    className={
                      sortTab === 'major'
                        ? 'w-full max-w-xl bg-white rounded-2xl shadow mb-3'
                        : 'w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-4'
                    }
                  >
                    {/* 在按API顺序排序时显示分组标题 */}
                    {/* {sortTab === 'willingness' && (
                      <div className="text-[16px] font-bold border-b pb-2 mb-2">
                        【
                        {rankOptions.find((option) => option.id === items.group.toString())?.label}
                        】{' '}
                        {rankOptions.find((option) => option.id === items.group.toString())?.count}
                        个 &nbsp;{' '}
                      </div>
                    )} */}

                    {/* 按专业排序时显示层级结构 */}
                    {sortTab === 'major' ? (
                      <div className="w-full max-w-xl bg-white rounded-2xl shadow">
                        {/* 专业信息头部 - 完全按照intentiondetail.tsx的样式 */}
                        <div
                          className="flex items-center justify-between bg-[#dee9fd] rounded-t-xl p-4 mb-1"
                          onClick={() => {
                            if (isMajorGroup) {
                              const majorGroup = (items as any).majorGroup as MajorGroup;
                              navigate(
                                `/major/majorlovedetail?majorCode=${majorGroup.majorCode}&&majorName=${majorGroup.majorName}&score=${majorGroup.rankGroups?.[0]?.schools?.[0]?.majors?.[0]?.score || 0}&isFavorite=true`,
                                { replace: false }
                              );
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <span className="text-blue-600 text-base font-bold mr-3">
                              {isMajorGroup
                                ? (items as any).majorGroup.majorCode
                                : items.result[0]?.majorCode}
                            </span>
                            <span className="text-blue-700 text-base font-bold">
                              {(() => {
                                const majorName = isMajorGroup
                                  ? (items as any).majorGroup.majorName
                                  : items.result[0]?.majorName || '';
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
                                (isMajorGroup
                                  ? (items as any).majorGroup.rankGroups?.[0]?.schools?.[0]
                                      ?.majors?.[0]?.developmentPotential
                                  : items.result[0]?.developmentPotential) || 0
                              )}
                              分！
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 p-2">
                          {/* 按API顺序分组显示 */}
                          {isMajorGroup && rankGroups.length > 0 ? (
                            rankGroups.map((rankGroup) => {
                              const key = `${(items as any).majorGroup.majorCode}_${rankGroup.groupIndex}`;
                              const isExpanded = expandedMajorGroups[key] !== false; // 默认展开，除非明确设置为false
                              const filteredSchools = rankGroup.schools;

                              // 如果没有学校，不显示该按API顺序
                              if (filteredSchools.length === 0) {
                                return null;
                              }

                              return (
                                <div key={rankGroup.groupIndex} className="mb-5">
                                  {/* 按API顺序标题 */}
                                  <div className="flex items-center justify-between font-bold mb-4 text-sm border-b border-solid pb-3 border-gray-200 pr-0">
                                    <div className="flex items-center">
                                      <button
                                        onClick={() => {
                                          const key = `${(items as any).majorGroup.majorCode}_${rankGroup.groupIndex}`;
                                          setExpandedMajorGroups((prev) => ({
                                            ...prev,
                                            [key]: !isExpanded, // 使用当前的isExpanded状态
                                          }));
                                        }}
                                        className="mr-3 text-gray-500 hover:text-gray-700 transition-colors text-lg"
                                      >
                                        {isExpanded ? '▼' : '▶'}
                                      </button>
                                      <span className="text-gray-900"> {rankGroup.groupName} </span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-gray-600 text-sm mr-1">
                                        {rankGroup.schools.length}所院校
                                      </span>
                                    </div>
                                  </div>

                                  {/* 该按API顺序的院校列表 */}
                                  {isExpanded &&
                                    rankGroup.schools.map((schoolGroup: SchoolGroup) => (
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
                                                  navigate(
                                                    `/major/schooldetail?schoolCode=${schoolGroup.schoolCode}&schoolname=${schoolGroup.schoolName}`
                                                  );
                                                }}
                                              >
                                                {schoolGroup.schoolName.length > 10
                                                  ? `${schoolGroup.schoolName.substring(0, 10)}...`
                                                  : schoolGroup.schoolName}
                                              </span>
                                              {/* 位次差显示 - 在入选志愿和备选志愿tab的按专业子tab中显示 */}
                                              {(activeTab === 'selected' ||
                                                activeTab === 'alternatives') &&
                                                (sortTab as any) === 'major' &&
                                                schoolGroup.majors[0]?.Rankdiff !== undefined &&
                                                getRankdiffDom(schoolGroup.majors[0])}
                                            </div>
                                            {/* 操作按钮 */}
                                            {activeTab === 'alternatives' ? (
                                              <div className="flex space-x-2">
                                                {schoolGroup.majors.map((item: any) => (
                                                  <button
                                                    key={item.id}
                                                    className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                                      loadingStatus[
                                                        `${item.schoolCode}_${item.majorCode}`
                                                      ]
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : item.selected
                                                          ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                                                          : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                                                    }`}
                                                    onClick={() => handleAlternativeClick(item)}
                                                    disabled={
                                                      item.selected ||
                                                      loadingStatus[
                                                        `${item.schoolCode}_${item.majorCode}`
                                                      ]
                                                    }
                                                  >
                                                    {loadingStatus[
                                                      `${item.schoolCode}_${item.majorCode}`
                                                    ]
                                                      ? '处理中...'
                                                      : item.selected
                                                        ? '移除'
                                                        : '入选'}
                                                  </button>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="flex space-x-2">
                                                {schoolGroup.majors.map((item: any) => (
                                                  <button
                                                    key={item.id}
                                                    className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                                      loadingStatus[
                                                        `${item.schoolCode}_${item.majorCode}`
                                                      ]
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                                                    }`}
                                                    onClick={() => handleUnselectClick(item)}
                                                    disabled={
                                                      loadingStatus[
                                                        `${item.schoolCode}_${item.majorCode}`
                                                      ]
                                                    }
                                                  >
                                                    {loadingStatus[
                                                      `${item.schoolCode}_${item.majorCode}`
                                                    ]
                                                      ? '处理中...'
                                                      : '移除'}
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          {/* 学校标签行 */}
                                          {schoolGroup.majors.map((item: any) => (
                                            <div key={item.id}>
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
                                                {Number(item.enrollmentRate) > 0 && (
                                                  <span
                                                    key={item.schoolName + '按专业'}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                                  >
                                                    按专业{item.enrollmentRate}%
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
                            // 如果没有按API顺序分组，显示简单的学校列表
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
                                            navigate(
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
                                      {activeTab === 'alternatives' ? (
                                        <div className="flex space-x-2">
                                          {schoolGroup.majors.map((item: any) => (
                                            <button
                                              key={item.id}
                                              className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                                loadingStatus[
                                                  `${item.schoolCode}_${item.majorCode}`
                                                ]
                                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                  : item.selected
                                                    ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                                                    : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                                              }`}
                                              onClick={() => handleAlternativeClick(item)}
                                              disabled={
                                                item.selected ||
                                                loadingStatus[
                                                  `${item.schoolCode}_${item.majorCode}`
                                                ]
                                              }
                                            >
                                              {loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                                                ? '处理中...'
                                                : item.selected
                                                  ? '移除'
                                                  : '入选'}
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="flex space-x-2">
                                          {schoolGroup.majors.map((item: any) => (
                                            <button
                                              key={item.id}
                                              className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                                loadingStatus[
                                                  `${item.schoolCode}_${item.majorCode}`
                                                ]
                                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                  : 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                                              }`}
                                              onClick={() => handleUnselectClick(item)}
                                              disabled={
                                                loadingStatus[
                                                  `${item.schoolCode}_${item.majorCode}`
                                                ]
                                              }
                                            >
                                              {loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                                                ? '处理中...'
                                                : '移除'}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* 学校标签行 */}
                                    {schoolGroup.majors.map((item: any) => (
                                      <div key={item.id}>
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
                                          {Number(item.enrollmentRate) > 0 && (
                                            <span
                                              key={item.schoolName + '按专业'}
                                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                            >
                                              按专业{item.enrollmentRate}%
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
                    ) : (
                      /* 原有的渲染逻辑（按API顺序排序等） */
                      displaySchools.map((schoolGroup) => (
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
                              {/* 在按专业排序时显示按API顺序信息，且按API顺序不为0时显示 */}
                              {(sortTab as any) === 'major' &&
                                schoolGroup.majors.length > 0 &&
                                schoolGroup.majors[0].group &&
                                schoolGroup.majors[0].group !== 0 && (
                                  <span className="text-white text-sm opacity-80">
                                    ({groupNames[schoolGroup.majors[0].group]})
                                  </span>
                                )}
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
                                  {/* 按自主意愿不显示，但在按API顺序和按专业排序时显示 */}
                                  {activeTab !== 'selected' &&
                                    (sortTab === 'willingness' || (sortTab as any) === 'major') && (
                                      <span className="text-green-600 bg-green-100  py-0.5 rounded text-xs ">
                                        发展潜能{item.developmentPotential}分！
                                      </span>
                                    )}
                                  {/* 显示按专业和按位次差(低→高) */}
                                  {(sortTab === 'major' || sortTab === 'rankDiff') && (
                                    <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs font-bold">
                                      {sortTab === 'major'
                                        ? `按专业${item.enrollmentRate && item.enrollmentRate > 0 ? item.enrollmentRate + '%' : '待补充'}`
                                        : `按位次差(低→高)${item.employmentRate && item.employmentRate > 0 ? item.employmentRate + '%' : '待补充'}`}
                                    </span>
                                  )}
                                  {/* 显示发展潜能值 */}
                                  {(sortTab as any) === 'major' && (
                                    <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded text-xs font-bold">
                                      发展潜能{Math.ceil(item.developmentPotential || 0)}分
                                    </span>
                                  )}

                                  {/* 显示自主意愿分数 */}
                                  {(sortTab as any) !== 'major' &&
                                    (activeTab === 'selected' || activeTab === 'alternatives') &&
                                    getRankdiffDom(item)}
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
                                          loadingStatus[
                                            `${item.schoolCode}_${item.majorCode}_remove`
                                          ]
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                        onClick={() => handleUnselectClick(item)}
                                        disabled={
                                          loadingStatus[
                                            `${item.schoolCode}_${item.majorCode}_remove`
                                          ]
                                        }
                                      >
                                        {loadingStatus[
                                          `${item.schoolCode}_${item.majorCode}_remove`
                                        ]
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
                                      disabled={
                                        loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                                      }
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
                                {Number(item.enrollmentRate) > 0 && true && (
                                  <span
                                    key={item.schoolName + '按专业'}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                  >
                                    按专业{item.enrollmentRate}%
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
                                {/* 位次差标签 - 在入选志愿和备选志愿tab的按专业子tab中显示，且位次差不为0时显示 */}
                                {(activeTab === 'selected' || activeTab === 'alternatives') &&
                                  (sortTab as any) === 'major' &&
                                  item.Rankdiff !== undefined &&
                                  item.Rankdiff !== 0 && (
                                    <span
                                      key={item.schoolName + '位次差'}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                    >
                                      上年较您
                                      <span
                                        className={
                                          item.Rankdiff > 0
                                            ? 'text-red-600 bg-red-100'
                                            : 'text-green-600 bg-green-100'
                                        }
                                      >
                                        {item.Rankdiff > 0
                                          ? `高${item.Rankdiff}位次/${Math.floor(item.RankdiffPer || 0)}%`
                                          : `低${Math.abs(item.Rankdiff)}位次/${Math.floor(item.RankdiffPer || 0)}%`}
                                      </span>
                                    </span>
                                  )}

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

                              {/* 手动排序按钮 - 仅在入选志愿页面且按自主意愿排序时显示 */}
                              {activeTab === 'selected' && sortTab === 'willingness' && (
                                <div className="flex justify-center space-x-2 mt-0 mb-3">
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
                      ))
                    )}

                    {/* 展开/收起按钮 - 当分组下有多个学校时显示，且仅在按API顺序排序时显示 */}
                    {hasMoreSchools && sortTab === 'willingness' && (
                      <div className="mt-2 text-center">
                        <button
                          onClick={() => {
                            if (isMajorGroup) {
                              // 按专业分组的展开/收起
                              const majorCode = (items as any).majorGroup.majorCode;
                              setExpandedMajorGroups((prev) => ({
                                ...prev,
                                [majorCode]: !prev[majorCode],
                              }));
                            } else {
                              // 按按API顺序分组的展开/收起
                              activeTab === 'alternatives'
                                ? toggleAlternativesExpansion(items.group)
                                : toggleSelectedExpansion(items.group);
                            }
                          }}
                          className="text-blue-600 text-sm hover:text-blue-800 transition-colors"
                        >
                          {majorGroupExpanded
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

      {/* 可关闭的透明浮层提示 */}
      {showFloatingTip && activeTab === 'alternatives' && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-3">
                <p className="text-sm leading-relaxed">
                  点击
                  <span className="font-bold text-yellow-300 bg-yellow-300/20 px-1 rounded">
                    入选
                  </span>
                  后，该院校及专业信息自动进入&ldquo;志愿表&rdquo;；点击
                  <span className="font-bold text-red-300 bg-red-300/20 px-1 rounded">移除</span>
                  后，该院校及专业信息将不再出现在&ldquo;备选志愿&rdquo;频道。
                </p>
              </div>
              <button
                onClick={() => setShowFloatingTip(false)}
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
        selectedIndex={2}
        onSelect={() => {
          window.location.href = '/educational';
        }}
      />

      {/* 取消入选确认对话框 */}
      {showUnselectDialog && itemToUnselect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2] p-4 ">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* 对话框头部 */}
            <div className="text-center mb-6">
              <div className="text-green-500 text-4xl mb-3">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">&ldquo;入选&rdquo;确认点</h3>
              <p className="text-sm text-gray-600">
                请借助招生简章、院校官网、拨打招生办公室电话、上网搜索等多种办法，确认以下关键信息：
              </p>
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
                      1. 您是否符合该院校本专业招生要求？
                    </h5>
                    <button
                      onClick={handleViewCharters}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      <span className="mr-1">查看招生简章</span>
                      <span className="text-xs">{'>>'}</span>
                    </button>
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
                      2. 院校近几年按专业、按位次差(低→高)、招生校区等，是否符合您的报考意愿？
                    </h5>

                    {itemToSelect.admissionsSite ? (
                      <button
                        onClick={() => window.open(itemToSelect.admissionsSite, '_blank')}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        <span className="mr-1">查看院校官网</span>
                        <span className="text-xs">{'>>'}</span>
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">
                        暂未收集招生网址，请手动访问院校官网
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 选项3：退档风险确认 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectConfirmations.riskControl}
                    onChange={(e) =>
                      handleSelectConfirmationChange('riskControl', e.target.checked)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      3.
                      该校是否承诺对服从调剂且满足招生要求的考生&ldquo;进档不退档&rdquo;、退档风险低？
                    </h5>
                    {itemToSelect.admissionsPhone ? (
                      <button
                        onClick={() => window.open(`tel:${itemToSelect.admissionsPhone}`)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        <span className="mr-1">招生办电话：{itemToSelect.admissionsPhone}</span>
                        <span className="text-xs">{'>>'}</span>
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">暂未收集招生电话，请手动查询</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 选项4：专业组确认 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectConfirmations.majorGroup}
                    onChange={(e) => handleSelectConfirmationChange('majorGroup', e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      4. 如果被调剂至组内其他专业，是否可接受？
                    </h5>
                    {itemToSelect.majorGroupName ? (
                      <button
                        onClick={() => handleViewMajorGroup()}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        <span className="mr-1">查看专业组</span>
                        <span className="text-xs">{'>>'}</span>
                      </button>
                    ) : (
                      '请自行查询并确认'
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
                        style={{ width: '15%' }}
                      >
                        专业名称
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '15%' }}
                      >
                        专业说明
                      </th>
                      <th
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: '10%' }}
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
                          title={item.majorNameDetail}
                        >
                          {item.majorNameDetail}
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
                          {item.studyPeriod}
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

      {/* 志愿填报预警浮层 */}
      {showWarningModal && activeTab === 'selected' && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <div className="bg-red-500/90 backdrop-blur-sm rounded-2xl p-4 text-white shadow-lg border border-red-400">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-3">
                <div className="text-sm leading-relaxed mb-3">
                  <div className="font-semibold mb-1">
                    预警：您合计需填报{volunteerCount}个志愿，已确定{selectedCount}个，尚需确认
                    {volunteerCount - selectedCount}个。
                  </div>
                  <div className="text-red-100">请及时补充入选志愿，确保志愿填报的完整性。</div>
                </div>
              </div>
              <button
                onClick={handleWarningModalClose}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors ml-2"
                title="关闭预警"
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

      {/* 高发展潜能预警浮层 */}
      {showTopDevelopmentWarningModal && activeTab === 'alternatives' && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <div className="bg-orange-500/90 backdrop-blur-sm rounded-2xl p-4 text-white shadow-lg border border-orange-400">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-3">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">⚠️</span>
                  <h3 className="text-lg font-bold">高发展潜能专业预警</h3>
                </div>
                <div className="text-sm leading-relaxed mb-3">
                  <div className="font-semibold mb-1">预警：</div>
                  <div className="text-orange-100">
                    志愿表中&ldquo;高发展潜能专业&rdquo;低于3个，建议增加，避免个别专业当年报考热度太高导致滑档；
                  </div>
                </div>

                {/* 复选框选项 */}
                <div className="bg-orange-400/20 rounded-lg p-3 mb-3">
                  <div className="text-sm font-medium mb-2">请选择您的偏好：</div>
                  <label className="flex items-center text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topDevelopmentWarningChoices.todayNotShow}
                      onChange={(e) => handleTopDevelopmentWarningChoiceChange(e.target.checked)}
                      className="mr-2 rounded"
                    />
                    今天不显示此预警
                  </label>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleTopDevelopmentWarningModalConfirm}
                    className="bg-white text-orange-500 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                  >
                    我知道了
                  </button>
                </div>
              </div>
              <button
                onClick={handleTopDevelopmentWarningModalClose}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors ml-2"
                title="关闭预警"
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

      {/* 招生简章弹窗 */}
      <Modal
        open={showChartersDialog}
        onCancel={handleCloseChartersDialog}
        footer={null}
        width={800}
        centered
        className="rounded-2xl"
        style={{ top: '20%', zIndex: 10000 }}
        title={
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentSchoolInfo?.schoolName} - 招生简章
            </h3>
            <p className="text-sm text-gray-600">招生章程可能有多个，请仔细查看</p>
          </div>
        }
      >
        <div className="p-4">
          {chartersLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : chartersData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">暂未收集招生简章</div>
              <div className="text-sm text-gray-400">请手动访问院校官网查看招生简章</div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {chartersData.map((charter) => (
                <div
                  key={charter.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {charter.title || `${charter.year}年招生简章`}
                    </h4>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {charter.year}年
                    </span>
                  </div>
                  <div
                    className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: charter.content }}
                  ></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EducationalPage;
