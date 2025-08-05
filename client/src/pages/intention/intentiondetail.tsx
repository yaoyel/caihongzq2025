// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import BottomNav from '../comm/bottom';
import { useNavigate } from 'react-router-dom';
import Top from '../comm/top';
import { useSearchParams } from 'react-router-dom';
import { getMajorDetail } from '../../config';
import {
  createMajorAlternative,
  getMajorAlternatives,
  cancelAlternative,
  getMajorGroup,
} from '../../config/volunteer';
import { Modal, Button, Checkbox, message, Input, Tag } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  setExpandedGroups,
  toggleGroupExpansion,
  saveScrollPosition,
  setCurrentMajorInfo,
  setAlternativeStatus,
  updateAlternativeStatus,
  updateLoadingStatus,
} from '../../store/slices/intentionDetailSlice';

const EducationalDetailPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigator = useNavigate();
  const [searchParams] = useSearchParams();
  const majorCode = searchParams.get('majorCode');
  const majorName = searchParams.get('majorName');
  const score = searchParams.get('score');
  const groupNum = Number(searchParams.get('groupNum')) || null;

  // 弹框相关状态
  const [isTipModalVisible, setIsTipModalVisible] = useState(false);
  const [userChoices, setUserChoices] = useState({
    choice1: false,
    choice2: false,
  });

  // 专业组相关状态
  const [showMajorGroupDialog, setShowMajorGroupDialog] = useState(false);
  const [majorGroupData, setMajorGroupData] = useState<any[]>([]);
  const [currentMajorGroupInfo, setCurrentMajorGroupInfo] = useState<{
    majorGroupId: string;
    majorGroupName: string;
    schoolName: string;
  } | null>(null);

  // 添加排序相关状态
  const [activeTab, setActiveTab] = useState<'group' | 'enrollment' | 'employment'>('group');

  // 从 Redux 获取状态
  const { expandedGroups, alternativeStatus, loadingStatus, scrollPositions } =
    useSelector((state: RootState) => state.intentionDetail);

  // 搜索相关状态
  const [searchText, setSearchText] = useState('');
  const [selectedSchoolNature, setSelectedSchoolNature] = useState<string>('all');
  const [showSearchTips, setShowSearchTips] = useState(false);

  // 定义位次段映射关系
  const groupMapping = {
    2: '（-10%）到+（+5%）位次段院校',
    3: '（-30%） 到 （-10%）位次段院校',
    1: '（+5%）到（+30%）位次段院校',
    0: '其他位次段院校',
  };

  // 按照选中顺序定义位次段数组
  const selectedGroups = [2, 3, 1, 0];

  const [tuijianSchools, setTuijianSchools] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 添加滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 添加位次段引用映射
  const groupRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  // 添加防抖定时器引用
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // 添加用户滚动标志，防止自动滚动恢复干扰用户操作
  const userScrollingRef = useRef(false);
  // 添加自动滚动标志，防止用户滚动时触发自动滚动
  const autoScrollingRef = useRef(false);
  // 添加用户滚动防抖定时器
  const userScrollDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // 获取城市显示信息的辅助函数
  const getCityDisplayInfo = (school: any): string => {
    // 优先使用 provinceName 和 cityName
    if (school.provinceName && school.cityName) {
      return `${school.provinceName} ${school.cityName}`;
    }
    if (school.provinceName) {
      return school.provinceName;
    }
    if (school.cityName) {
      return school.cityName;
    }
    // 如果都没有，使用 schoolCity
    if (school.schoolCity) {
      return school.schoolCity;
    }
    // 最后才显示未知城市
    return '城市信息待补充';
  };

  // 位次差显示函数
  const getRankdiffDom = (school: any) => {
    // 如果位次差为0或不存在，则不显示
    if (!school.rankDiff || school.rankDiff === 0) {
      return null;
    }

    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold">
        上年较您
        <span
          className={school.rankDiff > 0 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'}
        >
          {school.rankDiff > 0
            ? `高${school.rankDiff}位次/${Math.floor(school.rankDiffPer || 0)}%`
            : `低${Math.abs(school.rankDiff)}位次/${Math.floor(school.rankDiffPer || 0)}%`}
        </span>
      </span>
    );
  };

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
      localStorage.setItem('intention-detail-tip-last-shown', today);
    }

    if (userChoices.choice2) {
      // 以后都不显示
      localStorage.setItem('intention-detail-tip-never-show', 'true');
    }

    setIsTipModalVisible(false);
  }, [userChoices]);

  // 处理提示弹窗关闭
  const handleTipModalClose = useCallback(() => {
    setIsTipModalVisible(false);
  }, []);

  // 生成页面唯一的存储键
  const getScrollStorageKey = useCallback(() => {
    return `scroll_position_${majorCode}_${groupNum}`;
  }, [majorCode, groupNum]);

  // 保存滚动位置到 Redux
  const saveScrollPositionToRedux = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      const storageKey = getScrollStorageKey();
      dispatch(saveScrollPosition({ key: storageKey, position: scrollTop }));
    }
  }, [dispatch, getScrollStorageKey]);

  // 从 Redux 恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    if (scrollContainerRef.current && isInitialized && !userScrollingRef.current) {
      const storageKey = getScrollStorageKey();
      const savedScrollTop = scrollPositions[storageKey];
      if (savedScrollTop) {
        // 标记正在自动滚动
        autoScrollingRef.current = true;

        // 使用setTimeout确保DOM已完全渲染
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = savedScrollTop;
          }
          // 延迟重置自动滚动标志
          setTimeout(() => {
            autoScrollingRef.current = false;
          }, 100);
        }, 100);
      }
    }
  }, [scrollPositions, getScrollStorageKey, isInitialized]);

  // 滚动事件处理函数（使用节流和防抖优化性能）
  const handleScroll = useCallback(() => {
    // 如果正在自动滚动，不处理用户滚动事件
    if (autoScrollingRef.current) {
      return;
    }

    // 标记用户正在滚动
    userScrollingRef.current = true;

    // 清除之前的用户滚动防抖定时器
    if (userScrollDebounceRef.current) {
      clearTimeout(userScrollDebounceRef.current);
    }

    // 使用requestAnimationFrame进行节流
    if (!(handleScroll as any).ticking) {
      (handleScroll as any).ticking = true;
      requestAnimationFrame(() => {
        // 只有当滚动位置真正改变时才保存
        if (scrollContainerRef.current && isInitialized) {
          const currentScrollTop = scrollContainerRef.current.scrollTop;
          const storageKey = getScrollStorageKey();
          const lastSavedPosition = scrollPositions[storageKey];

          // 只有当滚动位置变化超过20px时才保存，减少频繁更新
          if (Math.abs(currentScrollTop - (lastSavedPosition || 0)) > 20) {
            // 清除之前的防抖定时器
            if (scrollDebounceRef.current) {
              clearTimeout(scrollDebounceRef.current);
            }

            // 设置新的防抖定时器，延迟200ms保存
            scrollDebounceRef.current = setTimeout(() => {
              saveScrollPositionToRedux();
            }, 200);
          }
        }
        (handleScroll as any).ticking = false;
      });
    }

    // 设置用户滚动防抖定时器，延迟300ms后重置用户滚动标志
    userScrollDebounceRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 300);
  }, [saveScrollPositionToRedux, scrollPositions, getScrollStorageKey, isInitialized]);

  // 初始化ticking属性
  (handleScroll as any).ticking = false;

  // 滚动到指定位次段的函数
  const scrollToGroup = useCallback((targetGroupNum: number) => {
    const targetRef = groupRefs.current[targetGroupNum];
    if (targetRef && scrollContainerRef.current && !userScrollingRef.current) {
      // 标记正在自动滚动
      autoScrollingRef.current = true;

      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const targetTop = targetRef.getBoundingClientRect().top;
      const scrollTop = scrollContainerRef.current.scrollTop + (targetTop - containerTop) - 20; // 减去20px的偏移

      scrollContainerRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });

      // 延迟重置自动滚动标志
      setTimeout(() => {
        autoScrollingRef.current = false;
      }, 500);
    }
  }, []);

  // 切换位次段展开/收起状态
  const handleToggleGroupExpansion = (groupNum: number) => {
    dispatch(toggleGroupExpansion(groupNum));
  };





  // 处理Tab切换
  const handleTabChange = (tab: 'group' | 'enrollment' | 'employment') => {
    setActiveTab(tab);
  };

  // 搜索过滤逻辑
  const filterSchools = (schools: any[]) => {
    return schools.filter((school) => {
      // 搜索文本过滤
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        searchText === '' ||
        school.schoolName.toLowerCase().includes(searchLower) ||
        school.majorName?.toLowerCase().includes(searchLower) ||
        school.majorCode?.toLowerCase().includes(searchLower) ||
        getCityDisplayInfo(school).toLowerCase().includes(searchLower) ||
        (school.provinceName && isProvinceMatch(searchText, school.provinceName));

      // 学校性质过滤
      const matchesNature =
        selectedSchoolNature === 'all' || school.schoolNature === selectedSchoolNature;

      return matchesSearch && matchesNature;
    });
  };

  // 根据当前Tab对学校进行排序
  const getSortedSchools = (schools: any[]) => {
    const filteredSchools = filterSchools(schools);

    switch (activeTab) {
      case 'enrollment':
        // 按升学率倒序排列
        return filteredSchools.sort((a, b) => (b.enrollmentRate || 0) - (a.enrollmentRate || 0));
      case 'employment':
        // 按就业率倒序排列
        return filteredSchools.sort((a, b) => (b.employmentRate || 0) - (a.employmentRate || 0));
      case 'group':
      default:
        // 按位次段分组排列（保持原有逻辑）
        return filteredSchools;
    }
  };

  // 解析学校特色标签的函数
  const parseSchoolFeatures = (features: string | null | undefined): string[] => {
    if (!features) return [];

    // 按逗号分隔并去除空白字符
    return features
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  useEffect(() => {
    // 页面初始化逻辑
    const initializePage = async () => {
      try {
        if (!majorCode) {
          console.error('未找到专业代码');
          return;
        }

        // 设置当前专业信息到 Redux
        dispatch(setCurrentMajorInfo({ majorCode, groupNum }));

        // 并行获取专业详情和已备选志愿
        const [detailResponse, alternativesResponse] = await Promise.all([
          getMajorDetail(majorCode),
          getMajorAlternatives(),
        ]);

        // 处理专业详情数据
        if (detailResponse && detailResponse.code === 200) {
          if (detailResponse.data) {
            if (detailResponse.data.schools) {
              // 获取所有位次段的院校数据
              setTuijianSchools(detailResponse.data.schools);
            }
          }
        }

        // 处理已备选志愿数据
        if (alternativesResponse && alternativesResponse.code === 200) {
          const alternatives = alternativesResponse.data?.data || [];
          const alternativeMap: { [key: string]: { isAlternative: boolean; id?: string } } = {};

          // 构建已备选学校的映射
          alternatives.forEach((item: any) => {
            if (item.majorCode === majorCode) {
              const schoolKey = `${item.schoolCode}_${item.majorCode}`;
              alternativeMap[schoolKey] = { isAlternative: true, id: item.id };
            }
          });

          dispatch(setAlternativeStatus(alternativeMap));
        }

        // 标记初始化完成
        setIsInitialized(true);
        
        // 初始化位次段展开状态 - 在数据加载完成后设置
        const initialExpandedState: { [key: number]: boolean } = {};
        selectedGroups.forEach((group) => {
          // 默认展开传入的groupNum对应的位次段，其他收起
          // 确保groupNum是有效数字且不为NaN
          const shouldExpand = !isNaN(groupNum) && group === groupNum;
          initialExpandedState[group] = shouldExpand;
        });
        dispatch(setExpandedGroups(initialExpandedState));
      } catch (error) {
        console.error('页面初始化失败:', error);
      }
    };

    initializePage();
  }, [majorCode, groupNum, dispatch]);

  // 确保在数据加载完成后设置展开状态
  useEffect(() => {
    if (tuijianSchools && tuijianSchools.length > 0 && isInitialized) {
      // 检查每个位次段是否有数据
      const groupDataStatus = selectedGroups.map(group => ({
        group,
        hasData: tuijianSchools.filter(school => school.group === group).length > 0
      }));
      
      // 找到第一个有数据的位次段
      const firstGroupWithData = groupDataStatus.find(item => item.hasData)?.group;
      
      const initialExpandedState: { [key: number]: boolean } = {};
      selectedGroups.forEach((group) => {
        let shouldExpand = false;
        
        if (!isNaN(groupNum) && group === groupNum) {
          // 如果传入的位次段有数据，则展开
          const targetGroupHasData = groupDataStatus.find(item => item.group === group)?.hasData;
          shouldExpand = targetGroupHasData || false;
        } else if (group === firstGroupWithData) {
          // 如果传入的位次段没有数据，则展开第一个有数据的位次段
          shouldExpand = !isNaN(groupNum) && !groupDataStatus.find(item => item.group === groupNum)?.hasData;
        }
        
        initialExpandedState[group] = shouldExpand;
      });
      
      dispatch(setExpandedGroups(initialExpandedState));
    }
  }, [tuijianSchools, isInitialized, groupNum, dispatch]);

  // 检查是否需要显示提示弹窗
  useEffect(() => {
    if (tuijianSchools && tuijianSchools.length > 0) {
      // 检查是否设置了永远不显示
      const neverShow = localStorage.getItem('intention-detail-tip-never-show');
      if (neverShow === 'true') {
        return;
      }

      // 检查今天是否已经显示过
      const today = new Date().toDateString();
      const lastShownDate = localStorage.getItem('intention-detail-tip-last-shown');
      if (lastShownDate === today) {
        return;
      }

      // 显示弹窗
      const timer = setTimeout(() => {
        setIsTipModalVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [tuijianSchools.length]);

  // 监听滚动事件
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        // 清理防抖定时器
        if (scrollDebounceRef.current) {
          clearTimeout(scrollDebounceRef.current);
        }
        // 清理用户滚动防抖定时器
        if (userScrollDebounceRef.current) {
          clearTimeout(userScrollDebounceRef.current);
        }
      };
    }
  }, [handleScroll]);

  // 页面卸载和浏览器回退时保存滚动位置
  useEffect(() => {
    const saveOnPopState = () => {
      saveScrollPositionToRedux();
    };
    window.addEventListener('popstate', saveOnPopState);
    return () => {
      saveScrollPositionToRedux();
      window.removeEventListener('popstate', saveOnPopState);
    };
  }, [saveScrollPositionToRedux]);

  // 数据渲染后恢复滚动条位置或滚动到指定位次段
  useEffect(() => {
    if (tuijianSchools && tuijianSchools.length > 0 && isInitialized && !userScrollingRef.current) {
      // 如果有传入的groupNum，则滚动到对应位次段
      if (groupNum !== null && groupNum !== undefined) {
        // 延迟执行，确保DOM已渲染
        setTimeout(() => {
          scrollToGroup(groupNum);
        }, 500);
      } else {
        // 否则恢复之前的滚动位置
        setTimeout(() => {
          restoreScrollPosition();
        }, 300);
      }
    }
  }, [tuijianSchools, restoreScrollPosition, scrollToGroup, groupNum, isInitialized]);

  // 处理备选按钮点击
  // 通用的专业组查看函数
  const handleViewMajorGroup = async (school: any) => {
    if (school?.majorGroupId) {
      try {
        setCurrentMajorGroupInfo({
          majorGroupId: school.majorGroupId,
          majorGroupName: school.majorGroupName || '',
          schoolName: school.schoolName,
        });

        // 调用专业组API
        const response = await getMajorGroup(school.majorGroupId);

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

  const handleAlternativeClick = async (school: any) => {
    const schoolKey = `${school.schoolCode}_${majorCode}`;
    const currentStatus = alternativeStatus[schoolKey];

    // 如果正在加载中，直接返回
    if (loadingStatus[schoolKey]) {
      return;
    }

    try {
      // 设置加载状态
      dispatch(updateLoadingStatus({ key: schoolKey, loading: true }));

      if (currentStatus?.isAlternative && currentStatus.id) {
        // 如果已经备选，则取消备选
        const response = await cancelAlternative(currentStatus.id);

        if (response && response.code === 200) {
          // 更新备选状态
          dispatch(
            updateAlternativeStatus({
              key: schoolKey,
              status: { isAlternative: false, id: undefined },
            })
          );
          // 备选删除成功提示
          message.success('取消备选成功，已成功从志愿频道的备选志愿列表中移除。');
        } else {
          alert(response.message || '取消备选志愿失败');
        }
      } else {
        // 如果未备选，则添加备选
        // 准备历史分数数据
        const historyScoreData =
          school.historyScores?.map((item: any) => {
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
          majorCode: majorCode!,
          majorName: majorName!,
          schoolCode: school.schoolCode,
          schoolName: school.schoolName,
          enrollmentRate: school.enrollmentRate,
          employmentRate: school.employmentRate,
          majorGroupId: school.majorGroupId,
          majorGroupName: school.majorGroupName,
                        schoolFeature: school.schoolFeature || '',
          historyScore: historyScoreData,
          group: groupNum,
        });

        if (response && response.code === 200) {
          // 更新备选状态
          dispatch(
            updateAlternativeStatus({
              key: schoolKey,
              status: {
                isAlternative: true,
                id: response.data?.id,
              },
            })
          );
          // 备选成功提示
          message.success('备选成功，已成功加入志愿频道的备选志愿列表。');
        } else {
          alert(response.message || '添加备选志愿失败');
        }
      }
    } catch (error) {
      console.error('备选志愿操作失败:', error);
      alert(error instanceof Error ? error.message : '备选志愿操作失败');
    } finally {
      // 清除加载状态
      dispatch(updateLoadingStatus({ key: schoolKey, loading: false }));
    }
  };

  const getHistoryScore = (historyScores) => {
    let htmlTemp = '';
    if (historyScores && historyScores.length > 0) {
      historyScores?.map((item, index) => {
        // 添加分隔线和备注信息（包括第一个）
        if (index > 0) {
          htmlTemp += `<div class="border-t border-gray-200 my-4"></div>`;
        }

        // 显示备注信息
        if (item.remark) {
          htmlTemp += `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div class="flex items-start">
                <span class="text-yellow-600 mr-2 mt-0.5">📝</span>
                <div class="text-sm text-yellow-800">
                  <span class="font-medium">备注：</span>
                  ${item.remark}
                </div>
              </div>
            </div>
          `;
        }

        // 历史分数表格
        if (item.historyScore && item.historyScore.length > 0) {
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

          item.historyScore?.map((hs) => {
            for (const [key, value] of Object.entries(hs)) {
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

  return (
    <div
      className="page-bg-hasTop text-gray-900"
      style={{ marginTop: 40, height: 'calc(100vh - 40px)', overflow: 'hidden' }}
    >
      <Top title="意向专业" onBack={() => window.history.back()} />
      <div
        ref={scrollContainerRef}
        className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3"
        style={{ height: 'calc(100vh - 120px)', overflowY: 'auto' }}
      >
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xl font-bold text-gray-900">
              意向专业-招生院校
            </div>
          </div>
        </div>

        <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-4">
          <div
            className="flex items-center justify-between bg-[#dee9fd] rounded-t-xl p-4 mb-1"
            onClick={() => {
              navigator(
                `/major/majorlovedetail?majorCode=${majorCode}&&majorName=${majorName}&score=${score}&isFavorite=true`,
                { replace: false } // 不使用 replace，保持正常的导航历史
              );
            }}
          >
            <div className="flex items-center">
              <span className="text-blue-600 text-base font-bold mr-3">{majorCode}</span>
              <span className="text-blue-700 text-base font-bold">
                {majorName.length > 8 ? `${majorName.substring(0, 8)}...` : majorName}{' '}
              </span>
              <span className="ml-2 text-gray-400">&gt;</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-900 font-bold mr-2">发展潜能</span>
              <span className="text-blue-700 font-bold text-base">{Math.ceil(score)}分！</span>
            </div>
          </div>
          <div className="space-y-2 p-2">
            {/* 院校信息块，严格还原设计图 */}
            {/* 第一个院校（未选中） */}
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
                    <span className="text-blue-800">找到 {getSortedSchools(tuijianSchools).length} 所院校</span>
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



            {/* 排序Tab */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => handleTabChange('group')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'group'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                位次段
              </button>
              <button
                onClick={() => handleTabChange('enrollment')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'enrollment'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                升学率
              </button>
              <button
                onClick={() => handleTabChange('employment')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'employment'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                就业率
              </button>
            </div>

            {/* 按位次段分组显示院校 */}
            {activeTab === 'group'
              ? // 位次段模式：按原有逻辑分组显示
                selectedGroups.map((groupNum) => {
                  // 获取当前位次段的院校
                  const groupSchools = tuijianSchools.filter((school) => school.group === groupNum);
                  const filteredGroupSchools = filterSchools(groupSchools);

                  // 如果没有院校，不显示该位次段
                  if (filteredGroupSchools.length === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={groupNum}
                      className="mb-5"
                      ref={(el) => {
                        groupRefs.current[groupNum] = el;
                      }}
                    >
                      {/* 位次段标题 */}
                      <div
                        className={`flex items-center justify-between font-bold mb-4 text-sm border-b border-solid pb-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                          groupNum === Number(searchParams.get('groupNum'))
                            ? 'border-blue-500 bg-blue-50 rounded-lg p-3 '
                            : 'border-gray-200'
                        } pr-0`}
                        onClick={() => handleToggleGroupExpansion(groupNum)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3 text-gray-500 text-lg">
                            {expandedGroups[groupNum] ? '▼' : '▶'}
                          </span>
                          <span className="text-gray-900"> {groupMapping[groupNum]} </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 text-sm mr-1">
                            {filteredGroupSchools.length}所院校
                          </span>
                        </div>
                      </div>

                      {/* 该位次段的院校列表 */}
                      {expandedGroups[groupNum] &&
                        filteredGroupSchools.map((school) => {
                          const schoolKey = `${school.schoolCode}_${majorCode}`;
                          const isAlternative =
                            alternativeStatus[schoolKey]?.isAlternative || false;
                          const isLoading = loadingStatus[schoolKey];

                          return (
                            <div
                              key={school.schoolCode}
                              className="border border-gray-200 mb-4 overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              {/* 院校头部 */}
                              <div className="p-4">
                                {/* 学校名称和备选按钮行 */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex-1 min-w-0 flex items-center space-x-2">
                                    <span
                                      className="text-blue-600 text-lg font-bold cursor-pointer hover:text-blue-700 transition-colors duration-200 truncate block"
                                      title={school.schoolName}
                                      onClick={() => {
                                        navigator(
                                          `/major/schooldetail?schoolCode=${school.schoolCode}&schoolname=${school.schoolName}`
                                        );
                                      }}
                                    >
                                      {school.schoolName.length > 10
                                        ? `${school.schoolName.substring(0, 10)}...`
                                        : school.schoolName}
                                    </span>
                                    {getRankdiffDom(school)}
                                  </div>
                                  <button
                                    className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                      isAlternative
                                        ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                                        : isLoading
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                                    }`}
                                    onClick={() => handleAlternativeClick(school)}
                                    disabled={isLoading}
                                  >
                                    {isLoading ? '处理中...' : isAlternative ? '移除' : '备选'}
                                  </button>
                                </div>

                                {/* 学校标签行 */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {/* 学校特色标签 */}
                                  {parseSchoolFeatures(school.schoolFeature).map((feature, index) => (
                                    <span
                                      key={`${school.schoolName}-feature-${index}`}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                  <span
                                    key={`${school.schoolCode}-公办-1`}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  >
                                    {school.schoolNature === 'public' ? '公办' : '民办'}
                                  </span>
                                  {school.enrollmentRate !== 0 && (
                                    <span
                                      key={`${school.schoolCode}-升学率-1`}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                    >
                                      升学率{school.enrollmentRate}%
                                    </span>
                                  )}
                                  {school.level !== 'zhuan' && (
                                    <span
                                      key={`${school.schoolCode}-保研率-1`}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                    >
                                      保研率{school.enrollmentRate}%
                                    </span>
                                  )}
                                  {school.majorGroupId && (
                                    <button
                                      key={`${school.schoolCode}-专业组-1`}
                                      onClick={() => handleViewMajorGroup(school)}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors cursor-pointer"
                                    >
                                      {school.majorGroupName}专业组
                                    </button>
                                  )}
                                  {/* 学制标签 */}
                                  {school.historyScores &&
                                    school.historyScores.length > 0 &&
                                    school.historyScores[0].studyPeriod && (
                                      <span
                                        key={`${school.schoolCode}-学制-1`}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                      >
                                        学制{school.historyScores?.[0]?.studyPeriod}年
                                      </span>
                                    )}
                                  <span
                                    key={school.schoolName + '校区'}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                                  >
                                    {school.cityName}
                                  </span>
                                </div>
                              </div>
                              {/* 表格内容 */}
                              <div
                                className="px-4 pb-4 bg-gray-50 rounded-b-lg"
                                dangerouslySetInnerHTML={{
                                  __html: getHistoryScore(school?.historyScores),
                                }}
                              ></div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })
              : // 升学率/就业率模式：按排序后的列表显示
                (() => {
                  const sortedSchools = getSortedSchools(tuijianSchools);

                  if (sortedSchools.length === 0) {
                    return <div className="text-center py-8 text-gray-500">暂无符合条件的院校</div>;
                  }

                  return (
                    <div className="space-y-4">
                      {sortedSchools.map((school) => {
                        const schoolKey = `${school.schoolCode}_${majorCode}`;
                        const isAlternative = alternativeStatus[schoolKey]?.isAlternative || false;
                        const isLoading = loadingStatus[schoolKey];

                        return (
                          <div
                            key={school.schoolCode}
                            className="border border-gray-200 overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            {/* 院校头部 */}
                            <div className="p-4">
                              {/* 学校名称和备选按钮行 */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1 min-w-0 flex items-center space-x-2">
                                  <span
                                    className="text-blue-600 text-lg font-bold cursor-pointer hover:text-blue-700 transition-colors duration-200 truncate block"
                                    title={school.schoolName}
                                    onClick={() => {
                                      navigator(
                                        `/major/schooldetail?schoolCode=${school.schoolCode}&schoolname=${school.schoolName}`
                                      );
                                    }}
                                  >
                                    {school.schoolName.length > 10
                                      ? `${school.schoolName.substring(0, 10)}...`
                                      : school.schoolName}
                                  </span>
                                  {getRankdiffDom(school)}
                                </div>
                                <button
                                  className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                    isAlternative
                                      ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-md'
                                      : isLoading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                                  }`}
                                  onClick={() => handleAlternativeClick(school)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? '处理中...' : isAlternative ? '撤选' : '备选'}
                                </button>
                              </div>

                              {/* 学校标签行 */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {school.enrollmentRate !== 0 && (
                                  <span
                                    key={`${school.schoolCode}-升学率-2`}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                  >
                                    升学率{school.enrollmentRate}%
                                  </span>
                                )}
                                {school.employmentRate !== 0 && (
                                  <span
                                    key={school.schoolName + '就业率'}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                  >
                                    就业率{school.employmentRate}%
                                  </span>
                                )}
                                {school.level !== 'zhuan' && (
                                  <span
                                    key={`${school.schoolCode}-保研率-2`}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                  >
                                    保研率{school.enrollmentRate}%
                                  </span>
                                )}
                                <span
                                  key={`${school.schoolCode}-专业组-2`}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"
                                >
                                  039专业组
                                </span>
                                <span
                                  key={`${school.schoolCode}-学制-2`}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                >
                                  学制4年
                                </span>
                                <span
                                  key={school.schoolName + '学费'}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                                >
                                  学费5800元/年
                                </span>
                                <span
                                  key={`${school.schoolCode}-公办-2`}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                                >
                                  公办
                                </span>
                                {/* 学校特色标签 */}
                                {parseSchoolFeatures(school.schoolFeature).map((feature, index) => (
                                  <span
                                    key={`${school.schoolName}-feature-${index}`}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
                                  >
                                    {feature}
                                  </span>
                                ))}
                                {/* 学制标签 */}
                                {school.historyScores &&
                                  school.historyScores.length > 0 &&
                                  school.historyScores[0].studyPeriod && (
                                    <span
                                      key={`${school.schoolCode}-学制-3`}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                                    >
                                      学制{school.historyScores[0].studyPeriod}
                                    </span>
                                  )}
                              </div>
                            </div>
                            {/* 表格内容 */}
                            <div
                              className="px-4 pb-4 bg-gray-50 rounded-b-lg"
                              dangerouslySetInnerHTML={{
                                __html: getHistoryScore(school?.historyScores),
                              }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
          </div>
        </div>
      </div>
      {/* 底部导航 */}
      <BottomNav
        selectedIndex={2}
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
          <div
            style={{
              padding: '16px 0',
              lineHeight: '1.8',
              fontSize: '14px',
              color: '#333',
            }}
          >
            <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2563eb' }}>
              请在意向专业所对应的院校中，点击&ldquo;备选&rdquo;，则相关院校会自动进入&ldquo;志愿&rdquo;频道，供进一步确认。
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
            <p className="text-sm text-gray-600">专业组详情</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentMajorGroupInfo?.schoolName} - {currentMajorGroupInfo?.majorGroupName}
            </p>
          </div>
        }
        open={showMajorGroupDialog}
        onCancel={handleCloseMajorGroupDialog}
        footer={null}
        width={800}
        centered
      >
        <div className="max-h-96 overflow-y-auto">
          {majorGroupData.length === 0 ? (
            <div className="text-gray-500">暂无专业组详情</div>
          ) : (
            <div className="space-y-4">
              {majorGroupData.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">专业代码：</span>
                      <span className="text-gray-900">{item.majorCode}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">专业名称：</span>
                      <span className="text-gray-900">{item.majorName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">批次：</span>
                      <span className="text-gray-900">{item.batch}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">计划数：</span>
                      <span className="text-gray-900">{item.num}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">学制：</span>
                      <span className="text-gray-900">{item.studyPeriod}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">学费：</span>
                      <span className="text-gray-900">{item.tuition}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">备注：</span>
                      <span className="text-gray-900">{item.remark || '无'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EducationalDetailPage;
