// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BottomNav from '../comm/bottom';
import StartWelcomePage from '../selfassessment/startWelcome';
import Top from '../comm/top';
import { getMajorAlternatives, selectAlternative } from '../../config/volunteer';

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
}

// 定义分组后的备选志愿类型
interface GroupedAlternatives {
  group: number;
  result: AlternativeItem[];
}

const EducationalPage: React.FC = () => {
  const navigate = useNavigate();
  const [alternatives, setAlternatives] = useState<GroupedAlternatives[]>([]);
  const [alternativesCount, setAlternativesCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0); // 添加入选志愿数量
  const [loading, setLoading] = useState(true); // 添加加载状态
  const [showDialog, setShowDialog] = useState(false); // 添加对话框状态
  const [selectedMajor, setSelectedMajor] = useState(''); // 添加选中的专业名称
  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({}); // 添加按钮加载状态
  const [activeTab, setActiveTab] = useState<'alternatives' | 'selected'>('alternatives'); // 添加页签状态
  const groupNames = [
    '其他位次段院校',
    '（+5%到+10%）位次段院校',
    '（-5%）到+（+5%）位次段院校',
    '（-15%） 到 （-5%）位次段院校',
  ];

  useEffect(() => {
    // 页面初始化逻辑
    const initializePage = async () => {
      try {
        setLoading(true);
        // 已备选志愿
        const alternativesResponse = await getMajorAlternatives();

        // 处理已备选志愿数据
        if (alternativesResponse && alternativesResponse.code === 200) {
          const alternativesData = alternativesResponse.data?.data || [];

          // 将 API 返回的数据转换为我们的类型
          const convertedData: AlternativeItem[] = alternativesData.map((item: any) => ({
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

          const alternativesCount = alternativesGroup.reduce(
            (acc: number, item: GroupedAlternatives) => {
              return acc + item.result.length;
            },
            0
          );
          setAlternativesCount(alternativesCount);

          // 计算已入选志愿数量
          const selectedCount = alternativesGroup.reduce(
            (acc: number, item: GroupedAlternatives) => {
              return acc + item.result.filter((alt) => alt.selected).length;
            },
            0
          );
          setSelectedCount(selectedCount);

          setAlternatives(alternativesGroup);
        }
      } catch (error) {
        console.error('页面初始化失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  // 渲染空状态提示
  const renderEmptyState = () => (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 text-center">
      <div className="mb-4">
        <div className="text-gray-400 text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">暂无备选志愿</h3>
        <p className="text-gray-500 text-sm mb-6">
          您还没有备选任何志愿，快去意向页面选择您感兴趣的院校和专业吧！
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

    // 执行入选操作
    try {
      // 设置加载状态
      setLoadingStatus((prev) => ({ ...prev, [itemKey]: true }));

      // 调用入选接口
      const response = await selectAlternative(item.id);

      if (response && response.code === 200) {
        // 更新本地状态
        setAlternatives((prevAlternatives) =>
          prevAlternatives.map((group) => ({
            ...group,
            result: group.result.map((resultItem) =>
              resultItem.id === item.id ? { ...resultItem, selected: true } : resultItem
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
    }
  };

  // 处理专业名称点击事件
  const handleMajorNameClick = (majorName: string) => {
    if (majorName.length > 8) {
      setSelectedMajor(majorName);
      setShowDialog(true);
    }
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

  const getHistoryScore = (historyScores: any[]) => {
    let htmlTemp = '';
    if (historyScores && historyScores.length > 0) {
      historyScores?.forEach((item: any) => {
        for (const [key, value] of Object.entries(item)) {
          const valueTemp = (value as string).split(',');
          htmlTemp += `<div  className="flex justify-between text-sm text-gray-700" style="display:flex;justify-content:space-between;"><span className="w-14 mr-2">${key}</span><span className="w-14 mr-2">${valueTemp && valueTemp.length > 2 ? valueTemp[0] + '分' : ''}</span>
            <span className="w-20 mr-2">第${valueTemp && valueTemp.length > 2 ? valueTemp[1] : ''}位次</span>
            <span>招生${valueTemp && valueTemp.length > 2 ? valueTemp[2] : ''}名</span></div>`;
        }
      });
    }
    return htmlTemp;
  };

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="备选志愿" onBack={() => window.history.back()} />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        {/* 页签组件 */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-4 mb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              <span className="text-[22px] font-bold text-gray-900">志愿管理</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              className={`flex-1 py-3 px-6 rounded-xl text-base font-semibold transition-all duration-300 ease-in-out shadow-sm relative overflow-hidden ${
                activeTab === 'alternatives'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:shadow-md border border-gray-200 hover:scale-105'
              }`}
              onClick={() => setActiveTab('alternatives')}
            >
              <div className="flex flex-col items-center relative z-10">
                <div className="flex items-center mb-1">
                  <span className="text-xl mr-2">📋</span>
                  <span className="text-lg font-bold">备选志愿</span>
                </div>
                <span
                  className={`text-sm font-medium ${activeTab === 'alternatives' ? 'text-blue-100' : 'text-gray-500'}`}
                >
                  {alternativesCount} 个
                </span>
              </div>
              {activeTab === 'alternatives' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-20 animate-pulse"></div>
              )}
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-xl text-base font-semibold transition-all duration-300 ease-in-out shadow-sm relative overflow-hidden ${
                activeTab === 'selected'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:shadow-md border border-gray-200 hover:scale-105'
              }`}
              onClick={() => setActiveTab('selected')}
            >
              <div className="flex flex-col items-center relative z-10">
                <div className="flex items-center mb-1">
                  <span className="text-xl mr-2">✅</span>
                  <span className="text-lg font-bold">入选志愿</span>
                </div>
                <span
                  className={`text-sm font-medium ${activeTab === 'selected' ? 'text-green-100' : 'text-gray-500'}`}
                >
                  {selectedCount} 个
                </span>
              </div>
              {activeTab === 'selected' && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-20 animate-pulse"></div>
              )}
            </button>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-6 text-center">
            <div className="text-gray-500">加载中...</div>
          </div>
        )}

        {/* 备选志愿页面 */}
        {!loading && activeTab === 'alternatives' && (
          <>
            {/* 空状态提示 */}
            {alternativesCount === 0 && renderEmptyState()}

            {/* 备选志愿列表 */}
            {alternativesCount > 0 &&
              alternatives.map((items) => (
                <div
                  key={items.group + 'group'}
                  className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-4"
                >
                  <div className="text-blue-600 text-[18px] font-bold border-b pb-2 mb-2">
                    【{groupNames[items.group]}】
                  </div>
                  {items.result.map((item) => (
                    <>
                      {/* 学校与基本信息 */}
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[18px] font-bold text-gray-900">
                            {item.schoolName}
                          </span>
                        </div>
                      </div>

                      {/* 专业与热爱能量 */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                          <span
                            className={`text-blue-700 font-bold text-[16px] mr-2 ${item.majorName.length > 8 ? 'cursor-pointer hover:text-blue-800' : ''}`}
                            onClick={() => handleMajorNameClick(item.majorName)}
                          >
                            {item.majorCode}{' '}
                            {item.majorName.length > 6
                              ? item.majorName.substring(0, 6) + '...'
                              : item.majorName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-xs font-bold">
                            热爱能量{Math.ceil((item.score || 0) * 100)}分！
                          </span>
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
                              item.selected || loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                            }
                          >
                            {loadingStatus[`${item.schoolCode}_${item.majorCode}`]
                              ? '处理中...'
                              : item.selected
                                ? '已入选'
                                : '入选'}
                          </button>
                        </div>
                      </div>

                      {/* 历年分数表格 */}
                      <div
                        className="mt-2 pb-2  space-y-"
                        dangerouslySetInnerHTML={{
                          __html: getHistoryScore(item?.historyScore || []),
                        }}
                      ></div>
                    </>
                  ))}
                </div>
              ))}
          </>
        )}

        {/* 入选志愿页面 */}
        {!loading && activeTab === 'selected' && (
          <>
            {/* 空状态提示 */}
            {selectedCount === 0 && (
              <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 text-center">
                <div className="mb-4">
                  <div className="text-gray-400 text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">暂无入选志愿</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    您还没有入选任何志愿，快去备选志愿页面选择您心仪的院校和专业吧！
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('alternatives')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  去备选志愿页面
                </button>
              </div>
            )}

            {/* 入选志愿列表 */}
            {selectedCount > 0 &&
              alternatives.map((items) => {
                const selectedItems = items.result.filter((item) => item.selected);
                if (selectedItems.length === 0) return null;

                return (
                  <div
                    key={items.group + 'group'}
                    className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-4"
                  >
                    <div className="text-blue-600 text-[18px] font-bold border-b pb-2 mb-2">
                      【{groupNames[items.group]}】
                    </div>
                    {selectedItems.map((item) => (
                      <>
                        {/* 学校与基本信息 */}
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[18px] font-bold text-gray-900">
                              {item.schoolName}
                            </span>
                          </div>
                        </div>

                        {/* 专业与热爱能量 */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center">
                            <span
                              className={`text-blue-700 font-bold text-[16px] mr-2 ${item.majorName.length > 8 ? 'cursor-pointer hover:text-blue-800' : ''}`}
                              onClick={() => handleMajorNameClick(item.majorName)}
                            >
                              {item.majorCode}{' '}
                              {item.majorName.length > 6
                                ? item.majorName.substring(0, 6) + '...'
                                : item.majorName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-xs font-bold">
                              热爱能量{Math.ceil((item.score || 0) * 100)}分！
                            </span>
                            <span className="bg-green-100 text-green-600 px-3 py-1 rounded text-sm font-medium">
                              已入选
                            </span>
                          </div>
                        </div>

                        {/* 历年分数表格 */}
                        <div
                          className="mt-2 pb-2  space-y-"
                          dangerouslySetInnerHTML={{
                            __html: getHistoryScore(item?.historyScore || []),
                          }}
                        ></div>
                      </>
                    ))}
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

      {/* 专业名称完整显示对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">专业名称</h3>
              <p className="text-gray-700 mb-6 break-words">{selectedMajor}</p>
              <button
                onClick={() => setShowDialog(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalPage;
