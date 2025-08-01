import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Checkbox, message } from 'antd';

import BottomNav from '../comm/bottom';
import StartWelcomePage from '../selfassessment/startWelcome';
import Top from '../comm/top';
import {
  cancelAlternative,
  nominate,
  createMajorAlternative,
  getMajorAlternatives,
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

const AiVolunteerPage: React.FC = () => {
  const navigate = useNavigate();
  const [alternatives, setAlternatives] = useState<GroupedAlternatives[]>([]);

  const [loading, setLoading] = useState(true); // 添加加载状态

  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({}); // 添加按钮加载状态

  // 分页加载相关状态
  const [displayCount, setDisplayCount] = useState(10); // 初始显示10个项目
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 滚动加载更多数据
  const handleScroll = useCallback(() => {
    if (isLoadingMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    console.log('滚动检测:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      displayCount,
      totalItems,
      remaining: scrollHeight - scrollTop - clientHeight,
    });

    // 当滚动到底部时加载更多
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      console.log('触发滚动加载:', { scrollTop, scrollHeight, clientHeight, displayCount });
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount((prev) => prev + 10); // 每次增加10个项目
        setIsLoadingMore(false);
      }, 500);
    }
  }, [isLoadingMore, displayCount]);

  // 添加全局滚动监听
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 添加备选状态管理
  const [alternativeStatus, setAlternativeStatus] = useState<{
    [key: string]: { isAlternative: boolean; id?: string };
  }>({});

  // 弹框相关状态
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  const [userChoices, setUserChoices] = useState({
    choice1: false,
    choice2: false,
  });

  // 排序Tab状态 - 控制排序方式
  const [sortTab, setSortTab] = useState<'willingness' | 'major' | 'rankDiff'>('rankDiff');

  const [recommendCount, setRecommendCount] = useState(0); // 推荐志愿数量

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

  // 处理用户选择变化
  const handleChoiceChange = useCallback((choice: 'choice1' | 'choice2', checked: boolean) => {
    setUserChoices((prev) => ({
      ...prev,
      [choice]: checked,
    }));
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
  const handleSortTabChange = (tab: 'willingness' | 'major' | 'rankDiff') => {
    setSortTab(tab);
  };

  // 根据当前排序Tab对数据进行排序
  const getSortedData = useCallback(
    (data: GroupedAlternatives[]) => {
      switch (sortTab) {
        case 'willingness': {
          // 按发展潜能分数由高到低排序
          const allWillingnessData = data.flatMap((group) => group.result);
          // 按发展潜能分数从高到低排序
          const sortedWillingnessData = allWillingnessData.sort(
            (a, b) => (b.developmentPotential || 0) - (a.developmentPotential || 0)
          );
          return [{ group: -1, result: sortedWillingnessData }];
        }
        case 'major': {
          // 按专业分组，每个专业下按位次段显示学校
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
          // 按位次差从低到高排序，并按学校分组
          const allRankDiffData = data.flatMap((group) => group.result);

          // 按学校分组
          const schoolGroups = groupBySchool(allRankDiffData);

          // 对每个学校组内的专业按位次差从低到高排序
          const sortedSchoolGroups = schoolGroups.map((schoolGroup) => ({
            ...schoolGroup,
            majors: schoolGroup.majors.sort((a, b) => (a.Rankdiff || 0) - (b.Rankdiff || 0)),
          }));

          // 对学校按历史最低录取分从高到低排序
          const sortedSchools = sortedSchoolGroups.sort((a, b) => {
            // 获取学校的历史最低录取分
            const getSchoolMinScore = (school: SchoolGroup) => {
              let minScore = 0;
              school.majors.forEach((major) => {
                if (major.historyScore && major.historyScore.length > 0) {
                  const firstHistoryScore = major.historyScore[0];
                  if (firstHistoryScore.historyScore && firstHistoryScore.historyScore.length > 0) {
                    const scoreData = firstHistoryScore.historyScore[0];
                    if (scoreData && typeof scoreData === 'object') {
                      // 遍历所有年份的分数，找到最低分
                      Object.values(scoreData).forEach((value: any) => {
                        if (typeof value === 'string') {
                          const scoreParts = value.split(',');
                          if (scoreParts.length > 0) {
                            const score = parseInt(scoreParts[0]);
                            if (!isNaN(score) && (minScore === 0 || score < minScore)) {
                              minScore = score;
                            }
                          }
                        }
                      });
                    }
                  }
                }
              });
              return minScore;
            };

            const scoreA = getSchoolMinScore(a);
            const scoreB = getSchoolMinScore(b);

            // 从高到低排序
            return scoreB - scoreA;
          });

          // 返回按学校分组的格式，所有学校作为一个group
          return [
            {
              group: -1000, // 使用负数避免与位次段分组冲突
              result: sortedSchools.flatMap((school) => school.majors),
              schoolGroups: sortedSchools, // 添加所有学校组信息
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

  // 根据当前Tab过滤数据
  const getFilteredData = useCallback(() => {
    // 备选志愿页面显示所有志愿（包括未入选的）
    return getSortedData(alternatives);
  }, [alternatives, getSortedData]);

  useEffect(() => {
    // 页面初始化逻辑
    const initializePage = async () => {
      try {
        setLoading(true);
        // 获取自动推荐的志愿
        const nominateResponse = await nominate();

        // 处理自动推荐志愿数据
        if (nominateResponse && nominateResponse.code === 200) {
          // 服务器返回的数据结构是 { schools, total, volunteerCount, recommendCount }
          const nominateData = nominateResponse.data.schools || [];

          // 从API响应中获取推荐志愿数量
          const apiRecommendCount = nominateResponse.data.recommendCount;
          if (apiRecommendCount !== undefined) {
            setRecommendCount(apiRecommendCount);
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

              setAlternativeStatus(alternativeMap);
            }
          } catch (error) {
            console.error('获取备选状态失败:', error);
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
            schoolName: item.name || '',
            priority: index + 1, // 使用索引作为优先级
            createdAt: new Date().toISOString(), // 使用当前时间
            score: 0, // 默认值，后续可以根据需要调整
            selected: false, // 默认未入选
            historyScore: item.historyScores || [],
            group: item.group || 0,
            enrollmentRate: item.enrollmentRate || 0,
            employmentRate: item.employmentRate || 0,
            Rankdiff: item.rankDiff || 0, // 位次差
            RankdiffPer: item.rankDiffPer || 0, // 位次差百分比
            // 学校标签相关属性
            schoolFeature: item.schoolFeature || '', // 学校特色
            schoolNature: item.belong === '省教育厅' ? 'public' : 'private', // 根据belong判断公办民办
            schoolLevel: '专科', // 根据实际情况调整
            majorGroupId: item.major?.majorGroupId?.toString() || '', // 专业组ID
            majorGroupName: item.major?.majorGroupName || '', // 专业组名称
            schoolCity: item.cityName || '', // 学校所在城市
            provinceName: '', // 默认值
            cityName: item.cityName || '', // 城市名称
            sortIndex: index, // 添加排序索引
            developmentPotential: parseFloat(item.major?.developmentPotential || '0') || 0, // 发展潜能
            position: index, // 位置排序字段
            // 招生信息相关属性
            admissionsSite: '', // 默认值
            admissionsPhone: '', // 默认值
          }));

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

  // 渲染空状态提示
  const renderEmptyState = () => (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 text-center">
      <div className="mb-4">
        <div className="text-gray-400 text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">暂无备选志愿</h3>
        <p className="text-gray-500 text-sm mb-6">
          您还没有任何备选志愿，快去意向页面选择您感兴趣的院校和专业吧！
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
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: true }));

      if (currentStatus?.isAlternative && currentStatus.id) {
        // 如果已经备选，则取消备选
        const response = await cancelAlternative(currentStatus.id);

        if (response && response.code === 200) {
          // 更新备选状态
          setAlternativeStatus((prev) => ({
            ...prev,
            [itemKey]: { isAlternative: false, id: undefined },
          }));
          // 备选删除成功提示
          message.success('取消备选成功，已成功从志愿频道的备选志愿列表中移除。');
        } else {
          alert(response?.message || '取消备选志愿失败');
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
          setAlternativeStatus((prev) => ({
            ...prev,
            [itemKey]: {
              isAlternative: true,
              id: response.data?.id,
            },
          }));
          // 备选成功提示
          message.success('备选成功，已成功加入志愿频道的备选志愿列表。');
        } else {
          alert(response?.message || '添加备选志愿失败');
        }
      }
    } catch (error) {
      console.error('备选志愿操作失败:', error);
      alert(error instanceof Error ? error.message : '备选志愿操作失败');
    } finally {
      // 清除加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  // 查看专业组详情
  // const handleViewMajorGroup = async (item: AlternativeItem) => {
  //   if (item?.majorGroupId) {
  //     try {
  //       setMajorGroupLoading(true);
  //       setCurrentMajorGroupInfo({
  //         majorGroupId: item.majorGroupId,
  //         majorGroupName: item.majorGroupName || '',
  //         schoolName: item.schoolName,
  //       });

  //       // 调用专业组API
  //       const response = await getMajorGroup(item.majorGroupId);

  //       if (response && response.code === 200) {
  //         setMajorGroupData(response.data || []);
  //         setShowMajorGroupDialog(true);
  //       } else {
  //         alert(response?.message || '获取专业组信息失败');
  //       }
  //     } catch (error) {
  //       console.error('获取专业组信息失败:', error);
  //       alert(error instanceof Error ? error.message : '获取专业组信息失败');
  //     } finally {
  //       setMajorGroupLoading(false);
  //     }
  //   }
  // };

  // 关闭专业组弹窗
  const handleCloseMajorGroupDialog = () => {
    setShowMajorGroupDialog(false);
    setMajorGroupData([]);
    setCurrentMajorGroupInfo(null);
  };

  // 查看招生简章
  // const handleViewCharters = async (item: AlternativeItem) => {
  //   if (item?.schoolCode) {
  //     try {
  //       setChartersLoading(true);
  //       setCurrentSchoolInfo({
  //         schoolCode: item.schoolCode,
  //         schoolName: item.schoolName,
  //       });

  //       // 调用招生简章API
  //       const response = await getSchoolCharters(item.schoolCode);

  //       if (response && response.code === 200) {
  //         setChartersData(response.data || []);
  //         setShowChartersDialog(true);
  //       } else {
  //         alert(response?.message || '获取招生简章失败');
  //       }
  //     } catch (error) {
  //       console.error('获取招生简章失败:', error);
  //       alert(error instanceof Error ? error.message : '获取招生简章失败');
  //     } finally {
  //       setChartersLoading(false);
  //     }
  //   }
  // };

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
  const totalItems = filteredData.reduce((total, group) => total + (group.result?.length || 0), 0);

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

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title={'AI推荐志愿' + recommendCount + '个'} onBack={() => window.history.back()} showRestartButton={true} />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        {/* 排序Tab选项卡 - 独立的card */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-4 mb-0">
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortTab === 'major'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              按专业
            </button>
            <button
              onClick={() => handleSortTabChange('willingness')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortTab === 'willingness'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              按发展潜能
            </button>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-6 text-center">
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
              <div ref={scrollContainerRef} className="w-full max-w-xl">
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
                  } else if (sortTab === 'rankDiff' && (group.result[0] as any).schoolGroups) {
                    // 按位次差排序时的学校分组数据
                    const schoolGroupsData = (group.result[0] as any).schoolGroups as SchoolGroup[];
                    schoolGroups = schoolGroupsData;
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
                          ? 'w-full max-w-xl bg-white rounded-2xl shadow mt-3'
                          : 'w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-4'
                      }
                    >
                      {/* 按专业排序时显示层级结构 */}
                      {sortTab === 'major' ? (
                        <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3">
                          {/* 专业信息头部 - 完全按照intentiondetail.tsx的样式 */}
                          <div
                            className="flex items-center justify-between bg-[#dee9fd] rounded-t-xl p-4 mb-1"
                            onClick={() => {
                              if (isMajorGroup && (group.result[0] as any).majorGroup) {
                                const majorGroup = (group.result[0] as any)
                                  .majorGroup as MajorGroup;
                                navigate(
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
                                                {item.enrollmentRate !== 0 && (
                                                  <span
                                                    key={item.schoolName + '升学率'}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                                  >
                                                    升学率
                                                    {item.enrollmentRate && item.enrollmentRate > 0
                                                      ? item.enrollmentRate + '%'
                                                      : '待补充'}
                                                  </span>
                                                )}
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
                                                  {getCityDisplayInfo(item)}
                                                </span>
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
                                            {item.enrollmentRate !== 0 && (
                                              <span
                                                key={item.schoolName + '升学率'}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                              >
                                                升学率
                                                {item.enrollmentRate && item.enrollmentRate > 0
                                                  ? item.enrollmentRate + '%'
                                                  : '待补充'}
                                              </span>
                                            )}
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
                                              {getCityDisplayInfo(item)}
                                            </span>
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
                        /* 按位次差排序时的学校分组显示 */
                        <div className="w-full max-w-xl bg-white rounded-2xl shadow">
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
                                      {/* 显示较上年变化 */}
                                      <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs font-bold">
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
                                            ? `高${item.Rankdiff}/${Math.floor(item.RankdiffPer || 0)}%`
                                            : (item.Rankdiff || 0) < 0
                                              ? `低${Math.abs(item.Rankdiff)}/${Math.floor(item.RankdiffPer || 0)}%`
                                              : '0%'}
                                        </span>
                                      </span>
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
                                    {item.enrollmentRate !== 0 && (
                                      <span
                                        key={item.schoolName + '升学率'}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                      >
                                        升学率
                                        {item.enrollmentRate && item.enrollmentRate > 0
                                          ? item.enrollmentRate + '%'
                                          : '待补充'}
                                      </span>
                                    )}
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
                                      {getCityDisplayInfo(item)}
                                    </span>
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
                      ) : (
                        /* 原有的渲染逻辑（位次段排序等） */
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
                                    {/* 显示较上年变化 */}
                                    <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs font-bold">
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
                                          ? `高${item.Rankdiff}/${Math.floor(item.RankdiffPer || 0)}%`
                                          : (item.Rankdiff || 0) < 0
                                            ? `低${Math.abs(item.Rankdiff)}/${Math.floor(item.RankdiffPer || 0)}%`
                                            : '0%'}
                                      </span>
                                    </span>
                                    {/* 显示发展潜能分数 */}
                                    {sortTab === 'willingness' && (
                                      <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded text-xs font-bold">
                                        发展潜能{Math.ceil(item.developmentPotential || 0)}分
                                      </span>
                                    )}

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
                                  {item.enrollmentRate !== 0 && (
                                    <span
                                      key={item.schoolName + '升学率'}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                    >
                                      升学率
                                      {item.enrollmentRate && item.enrollmentRate > 0
                                        ? item.enrollmentRate + '%'
                                        : '待补充'}
                                    </span>
                                  )}
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
                                    {getCityDisplayInfo(item)}
                                  </span>
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
                  <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-6 text-center">
                    <div className="text-gray-500">加载中...</div>
                  </div>
                )}

                {/* 显示更多按钮 */}
                {!isLoadingMore && displayCount < totalItems && (
                  <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-6 text-center">
                    <button
                      onClick={() => {
                        setIsLoadingMore(true);
                        setTimeout(() => {
                          setDisplayCount((prev) => prev + 10);
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

      {/* 提示弹窗 */}
      <Modal
        title={
          <div
            style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}
          >
            💡 Ai志愿填报说明
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
              点击“备选“按钮，该院校专业将进入”志愿“频道，作为”备选志愿“，供进一步筛选确认。
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

export default AiVolunteerPage;
