import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from 'antd';
import BottomNav from '../comm/bottom';
import Top from '../comm/top';
import { useNavigate } from 'react-router-dom';
import { getMajorIntentions, cancelMajorIntention } from '../../config/volunteer';

const EducationalPage: React.FC = () => {
  const navigator = useNavigate();
  const [majorIntentions, setMajorIntentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // 添加加载状态

  // 选项卡状态 - 控制最爱专业显示方式
  const [activeTab, setActiveTab] = useState<'development' | 'passion' | 'opportunity'>(
    'development'
  );
  // 子选项卡状态 - 控制学习特质显示方式
  const [activeSubTab, setActiveSubTab] = useState<'le' | 'shan' | 'yan' | 'zu'>();
  // 机遇指数子选项卡状态 - 控制机遇指数显示方式
  const [activeOpportunitySubTab, setActiveOpportunitySubTab] = useState<
    'academic' | 'career' | 'industry' | 'growth'
  >();

  // 统一的颜色主题 - 与 list.tsx 保持一致
  const colorTheme = {
    primary: '#2563eb', // 主蓝色
    secondary: '#1d4ed8', // 深蓝色
    light: '#dbeafe', // 浅蓝色背景
    text: '#1e40af', // 蓝色文字
    border: '#bfdbfe', // 蓝色边框
    hover: '#1e3a8a', // 悬停蓝色
  };

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
   * 获取收藏专业列表
   */
  const fetchMajorIntentions = async () => {
    try {
      setLoading(true);
      const response = await getMajorIntentions();
      if (response && response.code === 200) {
        const dataIntentions = response.data || [];
        // 使用排序逻辑对数据进行排序
        const sortedData = sortMajors(dataIntentions);
        setMajorIntentions(sortedData);
        console.log('收藏专业列表', response.data);
      }
    } catch (error) {
      console.error('获取收藏专业列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 移除收藏专业
   */
  const handleRemoveIntention = async (majorCode: string, majorName: string) => {
    // 使用 Ant Design 确认框
    Modal.confirm({
      title: '确认移除',
      content: `确定要移除专业"${majorName}"吗？`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await cancelMajorIntention(majorCode);
          if (response && response.code === 200) {
            // 从本地状态中移除该专业
            setMajorIntentions((prev) => prev.filter((item) => item.majorCode !== majorCode));
            console.log(`已移除专业: ${majorName}`);
          }
        } catch (error) {
          console.error('移除收藏专业失败:', error);
        }
      },
    });
  };

  // 当选项卡或子选项卡切换时，重新排序数据
  useEffect(() => {
    if (majorIntentions.length > 0) {
      const sortedData = sortMajors(majorIntentions);
      setMajorIntentions(sortedData);
    }
  }, [activeTab, activeSubTab, activeOpportunitySubTab, sortMajors]);

  useEffect(() => {
    // 页面初始化逻辑
    fetchMajorIntentions();
  }, []);

  // 渲染空状态提示
  const renderEmptyState = () => (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 text-center">
      <div className="mb-4">
        <div className="text-gray-400 text-6xl mb-4">📚</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">暂无收藏专业</h3>
        <p className="text-gray-500 text-sm mb-6">
          您还没有收藏任何专业，快去专业页面选择您感兴趣的专业吧！
        </p>
      </div>
      <button
        onClick={() => navigator('/major/list')}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        去专业页面收藏
      </button>
    </div>
  );

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="意向专业" onBack={() => window.history.back()} />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[18px] font-bold text-gray-900">
              意向专业
              <span className="ml-2 text-gray-400 text-base font-normal">收藏专业</span>
            </div>
            <div className="text-blue-600 text-[22px] font-bold">共{majorIntentions.length}个</div>
          </div>
        </div>

        {/* Tab 选项卡 */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-3 mb-3">
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
                  setActiveTab(tab.key as any);
                  // 切换主选项卡时重置子选项卡状态
                  setActiveSubTab(undefined);
                  setActiveOpportunitySubTab(undefined);
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
                    onClick={() => setActiveSubTab(subTab.key as any)}
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
                    onClick={() => setActiveOpportunitySubTab(subTab.key as any)}
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
                      background: activeOpportunitySubTab === subTab.key ? subTab.color : 'transparent',
                      color: activeOpportunitySubTab === subTab.key ? '#fff' : '#666',
                      boxShadow: activeOpportunitySubTab === subTab.key ? `0 2px 6px ${subTab.color}30` : 'none',
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

        {/* 加载状态 */}
        {loading && (
          <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-6 text-center">
            <div className="text-gray-500">加载中...</div>
          </div>
        )}

        {/* 空状态提示 */}
        {!loading && majorIntentions.length === 0 && renderEmptyState()}

        {/* 专业列表 */}
        {!loading &&
          majorIntentions.length > 0 &&
          majorIntentions.map((item) => (
            <div key={item.majorCode} className="w-full max-w-xl bg-white rounded-2xl shadow mt-3">
              <div
                className="flex items-center justify-between rounded-t-xl p-4 px-4 py-3 mb-3"
                style={{ backgroundColor: colorTheme.light }}
                onClick={() => {
                  navigator(
                    `/major/majorlovedetail?majorCode=${item.majorCode}&&majorName=${item.majorName}&score=${item.score}&isFavorite=true`,
                    { replace: false } // 不使用 replace，保持正常的导航历史
                  );
                }}
              >
                <div className="flex items-center">
                  <span 
                    className="text-sm font-bold mr-1"
                    style={{ color: colorTheme.text }}
                  >
                    {item.majorCode}
                  </span>
                  <span
                    className="text-base font-bold max-w-[120px] truncate"
                    style={{ color: colorTheme.text }}
                    title={item.majorName}
                  >
                    {item.majorName.length > 5
                      ? `${item.majorName.substring(0, 5)}...`
                      : item.majorName}
                  </span>
                  <span className="ml-2 text-gray-400">&gt;</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-900 font-bold mr-1">{getScoreDisplayText(item).text}</span>
                  <span 
                    className="font-bold text-lg"
                    style={{ color: colorTheme.text }}
                  >
                    {getScoreDisplayText(item).score}！
                  </span>
                </div>
                {/* 移除按钮 */}
                <div className="flex justify-end ">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止事件冒泡，避免触发导航
                      handleRemoveIntention(item.majorCode, item.majorName);
                    }}
                    className="text-sm px-3 py-1 rounded-lg border transition-colors"
                    style={{
                      color: '#ef4444',
                      borderColor: '#fecaca',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    移除
                  </button>
                </div>
              </div>

              <div className="space-y-1 p-3">
                <div className="flex items-center justify-between text-base">
                  <div>
                    <span className="text-green-600">（-10%）</span>
                    <span className="text-gray-900"> 到 </span>
                    <span className="text-red-600">（+5%）</span>
                    <span className="text-gray-900">位次段院校</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{item.group2}所</span>
                    <span
                      className={item.group2 > 0 ? '' : ''}
                      style={{
                        color: item.group2 > 0 ? colorTheme.text : '#9ca3af',
                        cursor: item.group2 > 0 ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        item.group2 > 0 &&
                          navigator(
                            '/intention/intentiondetail?majorCode=' +
                              item.majorCode +
                              '&groupNum=2&majorName=' +
                              item.majorName +
                              '&score=' +
                              item.developmentPotential
                          );
                      }}
                    >
                      查看
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-base">
                  <div>
                    <span className="text-green-600">（-30%）</span>
                    <span className="text-gray-900"> 到 </span>
                    <span className="text-green-600">（-10%）</span>
                    <span className="text-gray-900">位次段院校</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{item.group3}所</span>
                    <span
                      className={item.group3 > 0 ? '' : ''}
                      style={{
                        color: item.group3 > 0 ? colorTheme.text : '#9ca3af',
                        cursor: item.group3 > 0 ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        item.group3 > 0 &&
                          navigator(
                            '/intention/intentiondetail?majorCode=' +
                              item.majorCode +
                              '&groupNum=3&majorName=' +
                              item.majorName +
                              '&score=' +
                              item.score
                          );
                      }}
                    >
                      查看
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-base">
                  <div>
                    <span className="text-red-600">（+5%到+30%）</span>
                    <span className="text-gray-900">位次段院校</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{item.group1}所</span>
                    <span
                      className={item.group1 > 0 ? '' : ''}
                      style={{
                        color: item.group1 > 0 ? colorTheme.text : '#9ca3af',
                        cursor: item.group1 > 0 ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        item.group1 > 0 &&
                          navigator(
                            '/intention/intentiondetail?majorCode=' +
                              item.majorCode +
                              '&groupNum=1&majorName=' +
                              item.majorName +
                              '&score=' +
                              item.score
                          );
                      }}
                    >
                      查看
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-base">
                  <div>
                    <span className="text-gray-900">【其他位次段院校】</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{item.group0}所</span>
                    <span
                      className={item.group0 > 0 ? '' : ''}
                      style={{
                        color: item.group0 > 0 ? colorTheme.text : '#9ca3af',
                        cursor: item.group0 > 0 ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        item.group0 > 0 &&
                          navigator(
                            '/intention/intentiondetail?majorCode=' +
                              item.majorCode +
                              '&groupNum=0&majorName=' +
                              item.majorName +
                              '&score=' +
                              item.score
                          );
                      }}
                    >
                      查看
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

export default EducationalPage;
