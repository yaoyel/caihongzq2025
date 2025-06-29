// @ts-nocheck
import React, { useEffect, useState } from 'react';
import BottomNav from '../comm/bottom';
import Top from '../comm/top';
import { useSearchParams } from 'react-router-dom';
import { getMajorDetail } from '../../config';
import { createMajorAlternative, getMajorAlternatives } from '../../config/volunteer';

const EducationalDetailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const majorCode = searchParams.get('majorCode');
  const majorName = searchParams.get('majorName');
  const score = searchParams.get('score');
  const groupNum = Number(searchParams.get('groupNum'));
  const groupNames = [
    '其他位次段院校',
    '（+5%）到（+10%）位次段院校',
    '（-5%）到+（+5%）位次段院校',
    '（-15%） 到 （-5%）位次段院校',
  ];

  const [tuijianSchools, setTuijianSchools] = useState([]);
  // 添加备选状态管理
  const [alternativeStatus, setAlternativeStatus] = useState<{ [key: string]: boolean }>({});
  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({});

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
          const alternativeMap: { [key: string]: boolean } = {};

          // 构建已备选学校的映射
          alternatives.forEach((item: any) => {
            if (item.majorCode === majorCode) {
              const schoolKey = `${item.schoolCode}_${item.majorCode}`;
              alternativeMap[schoolKey] = true;
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

  // 处理备选按钮点击
  const handleAlternativeClick = async (school: any) => {
    const schoolKey = `${school.code}_${majorCode}`;

    // 如果正在加载中，直接返回
    if (loadingStatus[schoolKey]) {
      return;
    }

    try {
      // 设置加载状态
      setLoadingStatus((prev) => ({ ...prev, [schoolKey]: true }));

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
        setAlternativeStatus((prev) => ({ ...prev, [schoolKey]: true }));
      } else {
        alert(response.message || '添加备选志愿失败');
      }
    } catch (error) {
      console.error('添加备选志愿失败:', error);
      alert(error instanceof Error ? error.message : '添加备选志愿失败');
    } finally {
      // 清除加载状态
      setLoadingStatus((prev) => ({ ...prev, [schoolKey]: false }));
    }
  };

  const getHistoryScore = (historyScores) => {
    let htmlTemp = '';
    if (historyScores && historyScores.length > 0) {
      historyScores?.map((item) => {
        htmlTemp += `<div>${item.tuition}  ${item.planMajorName}</div>`;
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
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="意向专业" onBack={() => window.history.back()} />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[18px] font-bold text-gray-900">
              意向专业-招生院校
            </div>
          </div>
        </div>

        <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3">
          <div className="flex items-center justify-between bg-[#dee9fd] rounded-t-xl p-4 px-4 py-3 mb-3">
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
                <span className="text-gray-900 mr-2">{tuijianSchools.length}所</span>
              </div>
            </div>
            {tuijianSchools.map((school) => {
              const schoolKey = `${school.code}_${majorCode}`;
              const isAlternative = alternativeStatus[schoolKey];
              const isLoading = loadingStatus[schoolKey];

              return (
                <div
                  key={school.code}
                  className="border-b border-solid border-gray-200 mb-3 overflow-hidden bg-white"
                >
                  {/* 院校头部 */}
                  <div className="flex items-center justify-between py-2 ">
                    <div className="flex items-center space-x-2 ">
                      <span className="text-blue-600 text-lg font-bold">{school.name}</span>
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
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : isLoading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      onClick={() => handleAlternativeClick(school)}
                      disabled={isAlternative || isLoading}
                    >
                      {isLoading ? '添加中...' : isAlternative ? '已备选' : '备选'}
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
