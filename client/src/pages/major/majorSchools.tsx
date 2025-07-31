import React, { useEffect, useState } from 'react';
import Top from '../comm/top';
import { Card, Spin, message } from 'antd';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMajorDetail } from '../../config';
import { createMajorAlternative, getMajorAlternatives, cancelAlternative } from '../../config/volunteer';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setAlternativeStatus, updateAlternativeStatus, updateLoadingStatus } from '../../store/slices/intentionDetailSlice';

/**
 * 主页面组件
 */
const MajorSchools: React.FC = () => {
  const [searchParams] = useSearchParams();
  const majorCode = searchParams.get('majorCode');
  const majorName = searchParams.get('majorName');
  const type = searchParams.get('type');
  const [loading, setLoading] = useState(true); // 添加加载状态
  
  console.log(majorCode, majorName, type, 'majorCode, majorName, type');
  //+5--5
  const [tuijianSchools1, setTuijianSchools1] = useState([]);
  //-15- -5
  const [tuijianSchools2, setTuijianSchools2] = useState([]);
  //5--10
  const [tuijianSchools3, setTuijianSchools3] = useState([]);
  //其他位次院校
  const [tuijianSchools4, setTuijianSchools4] = useState([]);

  // 添加 Redux 相关
  const dispatch = useDispatch();
  const { alternativeStatus, loadingStatus } = useSelector((state: RootState) => state.intentionDetail);

  useEffect(() => {
    const fetchMajorDetail = async () => {
      setLoading(true); // 开始加载时设置loading为true
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

        if (detailResponse && (detailResponse as any).code === 200) {
          if ((detailResponse as any).data) {
            if ((detailResponse as any).data.schools) {
              setTuijianSchools1((detailResponse as any).data.schools.filter((s: any) => s.group === 2));
              setTuijianSchools2((detailResponse as any).data.schools.filter((s: any) => s.group === 3));
              setTuijianSchools3((detailResponse as any).data.schools.filter((s: any) => s.group === 1));
              setTuijianSchools4((detailResponse as any).data.schools.filter((s: any) => s.group === 0));
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
      } catch (error) {
        console.error('获取专业详细信息失败:', error);
      } finally {
        setLoading(false); // 无论成功失败都设置loading为false
      }
    };

    fetchMajorDetail();
  }, [searchParams, majorCode, dispatch]);
  const navigator = useNavigate();

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
          schoolCode: school.code,
          schoolName: school.name,
          schoolFeature: school.features || '',
          historyScore: historyScoreData,
          group: school.group.toString(),
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

  // 解析学校特色标签的函数
  const parseSchoolFeatures = (features: string | null | undefined): string[] => {
    if (!features) return [];

    // 按逗号分隔并去除空白字符
    return features
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  };

  const getHistoryScore = (historyScores: any) => {
    let htmlTemp = '';
    if (historyScores && historyScores.length > 0) {
      historyScores?.map((item: any, index: number) => {
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

          item.historyScore?.map((hs: any) => {
            for (const [key, value] of Object.entries(hs as any)) {
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
      });
    }
    return htmlTemp;
  };

  const renderSchool = (school: any) => {
    const schoolKey = `${school.code}_${majorCode}`;
    const isAlternative = alternativeStatus[schoolKey]?.isAlternative || false;
    const isLoading = loadingStatus[schoolKey];

    return (
      <div
        key={school.code}
        className="border border-gray-200 mb-4 overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        {/* 院校头部 */}
        <div className="p-4">
          {/* 学校名称和点击区域 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <span
                className="text-blue-600 text-lg font-bold cursor-pointer hover:text-blue-700 transition-colors duration-200 truncate block"
                title={school.name}
                onClick={() => {
                  navigator(
                    `/major/schooldetail?schoolCode=${school.code}&schoolname=${school.name}`
                  );
                }}
              >
                {school.name.length > 10
                  ? `${school.name.substring(0, 10)}...`
                  : school.name}
              </span>
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
            {parseSchoolFeatures(school.features).map((feature, index) => (
              <span
                key={`${school.name}-feature-${index}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
              >
                {feature}
              </span>
            ))}
            <span
              key={school.name + '公办'}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
            >
              {school.nature === 'public' ? '公办' : '民办'}
            </span>
            {school.enrollmentRate !== 0 && (
              <span
                key={school.name + '升学率'}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
              >
                升学率{school.enrollmentRate}%
              </span>
            )}
            {school.level !== 'zhuan' && (
              <span
                key={school.name + '保研率'}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
              >
                保研率{school.enrollmentRate}%
              </span>
            )}
            {school.majorGroupId && (
              <span
                key={school.name + '专业组'}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"
              >
                {school.majorGroupName}专业组
              </span>
            )}
            {/* 学制标签 */}
            {school.historyScores &&
              school.historyScores.length > 0 &&
              school.historyScores[0].studyPeriod && (
                <span
                  key={school.name + '学制'}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                >
                  学制{school.historyScores?.[0]?.studyPeriod}年
                </span>
              )}
            <span
              key={school.name + '校区'}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
            >
              {school.cityName || school.provinceName}
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
  };

  const renderSchoolTop = (title: string) => {
    return (
      <div
        style={{
          background: '#2563ff', // 设计图蓝色
          borderRadius: '12px 12px 0 0', // 顶部两个圆角
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          marginBottom: '8px',
          marginTop: '12px',
        }}
      >
        {title}
      </div>
    );
  };

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      
      <Top title={`${majorCode ?? ''}${majorName ?? ''}`} onBack={() => navigator(-1)} />
      

      
      <div className="bg-[#f7f7fa] flex flex-col justify-center items-start p-3">
        {/* 页面主卡片 */}
        <Card className="rounded-2xl w-full max-w-xl shadow" bodyStyle={{ padding: '24px 16px' }}>
          {loading ? (
            // 加载中状态
            <div className="flex flex-col items-center justify-center py-8">
              <Spin size="large" />
              <div className="mt-4 text-gray-600">正在加载院校信息...</div>
            </div>
          ) : (
            // 数据加载完成后的内容
            <>
              <div className="text-lg font-bold mb-2 flex items-center">
                <span className="w-1.5 h-4 bg-blue-500 rounded-sm mr-2 inline-block" />
                全部招生院校 {tuijianSchools1.length + tuijianSchools2.length + tuijianSchools3.length + tuijianSchools4.length}所
              </div>

              {tuijianSchools1.length > 0 &&
                renderSchoolTop('比您高考分低10%到高5%位次段院校 (' + tuijianSchools1.length + '所)')}
              {/* 院校招生信息列表 */}
              <div className="space-y-4">
                {tuijianSchools1.map((school) => renderSchool(school))}
              </div>
              {tuijianSchools2.length > 0 &&
                renderSchoolTop('比您高考分低30%到10%位次段院校 (' + tuijianSchools2.length + '所)')}
              {/* 院校招生信息列表 */}
              <div className="space-y-4">
                {tuijianSchools2.map((school) => renderSchool(school))}
              </div>
              {tuijianSchools3.length > 0 &&
                renderSchoolTop('比您高考分高5%到30%位次段院校(' + tuijianSchools3.length + '所)')}
              {/* 院校招生信息列表 */}
              <div className="space-y-4">
                {tuijianSchools3.map((school) => renderSchool(school))}
              </div>
              {tuijianSchools4.length > 0 &&
                renderSchoolTop('其他位次段院校(' + tuijianSchools4.length + '所)')}
              {/* 院校招生信息列表 */}
              <div className="space-y-4">
                {tuijianSchools4.map((school) => renderSchool(school))}
              </div>
            </>
          )}
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
    </div>
  );
};

export default MajorSchools;