// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import BottomNav from '../comm/bottom';
import { useNavigate } from 'react-router-dom';
import Top from '../comm/top';
import { useSearchParams } from 'react-router-dom';
import { getMajorDetail } from '../../config';
import { createMajorAlternative, getMajorAlternatives, cancelAlternative } from '../../config/volunteer';

const EducationalDetailPage: React.FC = () => {
  const navigator = useNavigate();
  const [searchParams] = useSearchParams();
  const majorCode = searchParams.get('majorCode');
  const majorName = searchParams.get('majorName');
  const score = searchParams.get('score');
  const groupNum = Number(searchParams.get('groupNum'));
  const groupNames = [
    '其他位次段院校',
    '（+5%）到（+30%）位次段院校',
    '（-10%）到+（+5%）位次段院校',
    '（-30%） 到 （-10%）位次段院校',
  ];

  const [tuijianSchools, setTuijianSchools] = useState([]);
  // 添加备选状态管理，存储备选志愿的ID
  const [alternativeStatus, setAlternativeStatus] = useState<{ [key: string]: { isAlternative: boolean; id?: string } }>({});
  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({});
  // 添加搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');

  // 添加滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 生成页面唯一的存储键
  const getScrollStorageKey = useCallback(() => {
    return `scroll_position_${majorCode}_${groupNum}`;
  }, [majorCode, groupNum]);

  // 保存滚动位置到localStorage
  const saveScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      const storageKey = getScrollStorageKey();
      localStorage.setItem(storageKey, scrollTop.toString());
    }
  }, [getScrollStorageKey]);

  // 从localStorage恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const storageKey = getScrollStorageKey();
      const savedScrollTop = localStorage.getItem(storageKey);
      if (savedScrollTop) {
        // 使用setTimeout确保DOM已完全渲染
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = parseInt(savedScrollTop, 10);
          }
        }, 100);
      }
    }
  }, [getScrollStorageKey]);

  // 滚动事件处理函数（使用节流优化性能）
  const handleScroll = useCallback(() => {
    // 使用requestAnimationFrame进行节流
    if (!handleScroll.ticking) {
      handleScroll.ticking = true;
      requestAnimationFrame(() => {
        saveScrollPosition();
        handleScroll.ticking = false;
      });
    }
  }, [saveScrollPosition]);

  // 初始化ticking属性
  handleScroll.ticking = false;

  // 过滤学校列表的函数
  const filteredSchools = tuijianSchools.filter((school) => {
    if (!searchKeyword.trim()) {
      return true;
    }
    return school.name.toLowerCase().includes(searchKeyword.toLowerCase());
  });

  useEffect(() => {
    // 页面初始化逻辑
    const initializePage = async () => {
      try {
        if (!majorCode) {
          console.error('未找到专业代码');
          return;
        }

        // 并行获取专业详情和已备选志愿
        const [detailResponse, alternativesResponse] = await Promise.all([
          getMajorDetail(majorCode),
          getMajorAlternatives(),
        ]);

        // 处理专业详情数据
        if (detailResponse && detailResponse.code === 200) {
          if (detailResponse.data) {
            if (detailResponse.data.schools) {
              setTuijianSchools(detailResponse.data.schools.filter((s) => s.group === groupNum));
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

          setAlternativeStatus(alternativeMap);
        }
      } catch (error) {
        console.error('页面初始化失败:', error);
      }
    };

    initializePage();
  }, [majorCode, groupNum]);

  // 监听滚动事件
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);

      // 恢复滚动位置
      restoreScrollPosition();

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll, restoreScrollPosition]);

  // 页面卸载和浏览器回退时保存滚动位置
  useEffect(() => {
    const saveOnPopState = () => {
      saveScrollPosition();
    };
    window.addEventListener('popstate', saveOnPopState);
    return () => {
      saveScrollPosition();
      window.removeEventListener('popstate', saveOnPopState);
    };
  }, [saveScrollPosition]);

  // 数据渲染后恢复滚动条位置
  useEffect(() => {
    if (tuijianSchools && tuijianSchools.length > 0) {
      restoreScrollPosition();
    }
  }, [tuijianSchools, restoreScrollPosition]);

  // 处理备选按钮点击
  const handleAlternativeClick = async (school: any) => {
    const schoolKey = `${school.code}_${majorCode}`;
    const currentStatus = alternativeStatus[schoolKey];

    // 如果正在加载中，直接返回
    if (loadingStatus[schoolKey]) {
      return;
    }

    try {
      // 设置加载状态
      setLoadingStatus((prev) => ({ ...prev, [schoolKey]: true }));

      if (currentStatus?.isAlternative && currentStatus.id) {
        // 如果已经备选，则取消备选
        const response = await cancelAlternative(currentStatus.id);
        
        if (response && response.code === 200) {
          // 更新备选状态
          setAlternativeStatus((prev) => ({ ...prev, [schoolKey]: { isAlternative: false, id: undefined } }));
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
          schoolCode: school.code,
          schoolName: school.name,
          schoolFeature: school.features || '',
          historyScore: historyScoreData,
          group: groupNum,
        });

        if (response && response.code === 200) {
          // 更新备选状态
          setAlternativeStatus((prev) => ({ 
            ...prev, 
            [schoolKey]: { 
              isAlternative: true, 
              id: response.data?.id 
            } 
          }));
        } else {
          alert(response.message || '添加备选志愿失败');
        }
      }
    } catch (error) {
      console.error('备选志愿操作失败:', error);
      alert(error instanceof Error ? error.message : '备选志愿操作失败');
    } finally {
      // 清除加载状态
      setLoadingStatus((prev) => ({ ...prev, [schoolKey]: false }));
    }
  };

  const getHistoryScore = (historyScores) => {
    let htmlTemp = '';
    if (historyScores && historyScores.length > 0) {
      historyScores?.map((item) => {
        htmlTemp += `<div  style="display:flex;justify-content:space-between;"><span>学费：${item.tuition}元/年</span>  <span>专业：${item.planMajorName}</span>  <span>选科：${item.subjectType}+${item.subjectSelection}</span></div>`;
        item.historyScore?.map((hs) => {
          for (const [key, value] of Object.entries(hs)) {
            const valueTemp = value.split(',');
            htmlTemp += `<div  className="flex justify-between text-sm text-gray-700" style="display:flex;justify-content:space-between;"><span className="w-14 mr-2">${key}</span><span className="w-14 mr-2">${valueTemp && valueTemp.length > 2 ? valueTemp[0] + '分' : ''}</span>
              <span className="w-20 mr-2">第${valueTemp && valueTemp.length > 2 ? valueTemp[1] : ''}位次</span>
              <span>招生${valueTemp && valueTemp.length > 2 ? valueTemp[2] : ''}名</span></div>`;
          }
        });
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
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[18px] font-bold text-gray-900">
              意向专业-招生院校
            </div>
          </div>
        </div>

        <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3">
          <div
            className="flex items-center justify-between bg-[#dee9fd] rounded-t-xl p-4 px-4 py-3 mb-3"
            onClick={() => {
              navigator(
                `/major/majorlovedetail?majorCode=${majorCode}&&majorName=${majorName}&score=${score}&isFavorite=true`,
                { replace: false } // 不使用 replace，保持正常的导航历史
              );
            }}
          >
            <div className="flex items-center">
              <span className="text-blue-600 text-lg font-bold mr-2">{majorCode}</span>
              <span className="text-blue-700 text-lg font-bold">{majorName}</span>
              <span className="ml-2 text-gray-400">&gt;</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-900 font-bold mr-1">热爱能量</span>
              <span className="text-blue-700 font-bold text-lg">{Math.ceil(score * 100)}分！</span>
            </div>
          </div>
          <div className="space-y-1 p-3">
            {/* 院校信息块，严格还原设计图 */}
            {/* 第一个院校（未选中） */}
            <div className="flex items-center justify-start font-bold  mb-3 text-base border-b border-solid border-gray-200 pb-2">
              <div className="flex items-center">
                【<span className="text-gray-900"> {groupNames[groupNum]} </span>】
              </div>
              <div className="flex items-center ml-5">
                <span className="text-gray-900 mr-2">{filteredSchools.length}所</span>
              </div>
            </div>
            
            {/* 搜索框 */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="搜索学校名称..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {filteredSchools.map((school) => {
              const schoolKey = `${school.code}_${majorCode}`;
              const isAlternative = alternativeStatus[schoolKey]?.isAlternative || false;
              const isLoading = loadingStatus[schoolKey];

              return (
                <div
                  key={school.code}
                  className="border-b border-solid border-gray-200 mb-3 overflow-hidden bg-white"
                >
                  {/* 院校头部 */}
                  <div className="flex items-center justify-between py-2 ">
                    <div className="flex items-center space-x-2 ">
                      <span
                        className="text-blue-600 text-lg font-bold"
                        onClick={() => {
                          navigator(
                            `/major/schooldetail?schoolCode=${school.code}&schoolname=${school.name}`
                          );
                        }}
                      >
                        {school.name}
                      </span>
                      <span
                        key={school.name + school.nature}
                        className="text-blue-600 text-sm font-bold mr-2"
                      >
                        {school.nature === 'public' ? '公办' : '民办'}
                      </span>
                      <span
                        key={school.name + school.provinceName}
                        className="text-blue-600 text-sm font-bold mr-2"
                      >
                        {school.provinceName}
                      </span>
                      <span
                        key={school.name + school.features}
                        className="text-blue-600 text-sm font-bold mr-2"
                      >
                        {school.features}
                      </span>
                    </div>
                    <button
                      className={`px-3 py-1 rounded ${
                        isAlternative
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : isLoading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      onClick={() => handleAlternativeClick(school)}
                      disabled={isLoading}
                    >
                      {isLoading ? '处理中...' : isAlternative ? '撤选' : '备选'}
                    </button>
                  </div>
                  {/* 表格内容 */}
                  <div
                    className="mt-2 pb-2  space-y-"
                    dangerouslySetInnerHTML={{ __html: getHistoryScore(school?.historyScores) }}
                  ></div>
                </div>
              );
            })}
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
    </div>
  );
};

export default EducationalDetailPage;
