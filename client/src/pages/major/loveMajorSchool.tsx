// @ts-nocheck
import React, { useEffect, useState } from 'react';
import Top from '../comm/top';
import { Card } from 'antd';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMajorDetail } from '../../config';
/**
 * 主页面组件
 */
const LoveMajorSchool: React.FC = () => {
  const [searchParams] = useSearchParams();
  const schoolName = searchParams.get('schoolName');
  const schoolCode = searchParams.get('schoolCode');
  const type = searchParams.get('type');

  //+5--5
  const [tuijianSchools1, setTuijianSchools1] = useState([]);
  //-15- -5
  const [tuijianSchools2, setTuijianSchools2] = useState([]);
  //5--10
  const [tuijianSchools3, setTuijianSchools3] = useState([]);
  useEffect(() => {}, []);
  const navigator = useNavigate();

  const renderSchool = (school) => {
    return (
      <div key={school.name} className="py-1 border-b last:border-b-0">
        {/* 院校头部 */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() =>
            navigator(`/major/schooldetail?code=${school.code}&schoolname=${school.name}`)
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
        <div className="mt-2 space-y-1">
          {[
            { year: '2024年', score: '638分', rank: '第51位次', count: '招生50名' },
            { year: '2023年', score: '638分', rank: '第51位次', count: '招生30名' },
            { year: '2022年', score: '638分', rank: '第51位次', count: '招生40名' },
          ].map((item, i) => (
            <div key={i} className="flex text-sm text-gray-700">
              <span className="w-14">{item.year}</span>
              <span className="w-14">{item.score}</span>
              <span className="w-20">{item.rank}</span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
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
      <Top title={schoolName} onBack={() => navigator(-1)} />
      <div className="bg-[#f7f7fa] flex flex-col justify-center items-start p-3">
        {/* 页面主卡片 */}
        <Card className="rounded-2xl w-full max-w-xl shadow" bodyStyle={{ padding: '24px 16px' }}>
          <div className="text-lg font-bold mb-2 flex items-center">
            <span className="w-1.5 h-4 bg-blue-500 rounded-sm mr-2 inline-block" />
            热爱专业 {tuijianSchools1.length + tuijianSchools2.length + tuijianSchools3.length} 个
          </div>

          {tuijianSchools1.length > 0 &&
            renderSchoolTop('比您高考分低5%到高5%位次段专业 (' + tuijianSchools1.length + '个)')}
          {/* 院校招生信息列表 */}
          <div className="w-full max-w-xl">
            {/* 模拟院校数据 */}
            {tuijianSchools1.map((school) => renderSchool(school))}
          </div>
          {tuijianSchools2.length > 0 &&
            renderSchoolTop('比您高考分低15%到5%位次段专业 (' + tuijianSchools2.length + '个)')}
          {/* 院校招生信息列表 */}
          <div className="w-full max-w-xl">
            {/* 模拟院校数据 */}
            {tuijianSchools2.map((school) => renderSchool(school))}
          </div>
          {tuijianSchools3.length > 0 &&
            renderSchoolTop('比您高考分高5%到10%位次段专业 (' + tuijianSchools3.length + '个)')}
          {/* 院校招生信息列表 */}
          <div className="w-full max-w-xl">
            {/* 模拟院校数据 */}
            {tuijianSchools3.map((school) => renderSchool(school))}
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
    </div>
  );
};

export default LoveMajorSchool;
