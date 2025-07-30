import React, { useEffect, useState } from 'react';
import Top from '../comm/top';
import { Card, Spin } from 'antd';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMajorDetail } from '../../config';

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

  useEffect(() => {
    const fetchMajorDetail = async () => {
      setLoading(true); // 开始加载时设置loading为true
      try {
        if (!majorCode) {
          console.error('未找到专业代码');
          return;
        }

        const detailResponse = await getMajorDetail(majorCode);

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
      } catch (error) {
        console.error('获取专业详细信息失败:', error);
      } finally {
        setLoading(false); // 无论成功失败都设置loading为false
      }
    };

    fetchMajorDetail();
  }, [searchParams]);
  const navigator = useNavigate();

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
            <span className="text-gray-400 text-lg">&gt;</span>
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