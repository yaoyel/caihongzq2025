// @ts-nocheck
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

        if (detailResponse && detailResponse.code === 200) {
          if (detailResponse.data) {
            if (detailResponse.data.schools) {
              setTuijianSchools1(detailResponse.data.schools.filter((s) => s.group === 2));
              setTuijianSchools2(detailResponse.data.schools.filter((s) => s.group === 3));
              setTuijianSchools3(detailResponse.data.schools.filter((s) => s.group === 1));
              setTuijianSchools4(detailResponse.data.schools.filter((s) => s.group === 0));
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

  const renderSchool = (school) => {
    return (
      <div key={school.name} className="py-1 border-b last:border-b-0">
        {/* 院校头部 */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() =>
            navigator(`/major/schooldetail?schoolCode=${school.code}&schoolname=${school.name}`)
          }
        >
          <div className="flex items-center">
            <span className="text-blue-600 font-bold text-base mr-2">{school.name}</span>
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
          <span className="text-gray-400 text-lg">&gt;</span>
        </div>
        {/* 招生数据 */}
        <div
          className="mt-2 space-y-1"
          dangerouslySetInnerHTML={{ __html: getHistoryScore(school?.historyScores) }}
        ></div>
      </div>
    );
  };

  const renderSchoolTop = (title) => {
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
                招生院校 {tuijianSchools1.length + tuijianSchools2.length + tuijianSchools3.length}所
              </div>

              {tuijianSchools1.length > 0 &&
                renderSchoolTop('比您高考分低5%到高5%位次段院校 (' + tuijianSchools1.length + '所)')}
              {/* 院校招生信息列表 */}
              <div className="w-full max-w-xl">
                {/* 模拟院校数据 */}
                {tuijianSchools1.map((school) => renderSchool(school))}
              </div>
              {tuijianSchools2.length > 0 &&
                renderSchoolTop('比您高考分低15%到5%位次段院校 (' + tuijianSchools2.length + '所)')}
              {/* 院校招生信息列表 */}
              <div className="w-full max-w-xl">
                {/* 模拟院校数据 */}
                {tuijianSchools2.map((school) => renderSchool(school))}
              </div>
              {tuijianSchools3.length > 0 &&
                renderSchoolTop('比您高考分高5%到10%位次段院校(' + tuijianSchools3.length + '所)')}
              {/* 院校招生信息列表 */}
              <div className="w-full max-w-xl">
                {/* 模拟院校数据 */}
                {tuijianSchools3.map((school) => renderSchool(school))}
              </div>
              {tuijianSchools4.length > 0 &&
                renderSchoolTop('其他位次段院校(' + tuijianSchools4.length + '所)')}
              {/* 院校招生信息列表 */}
              <div className="w-full max-w-xl">
                {/* 模拟院校数据 */}
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
