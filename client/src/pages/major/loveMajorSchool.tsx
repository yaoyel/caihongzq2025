// @ts-nocheck
import React, { useEffect, useState } from 'react';
import Top from '../comm/top';
import { Card } from 'antd';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSchoolDetail } from '../../config';
/**
 * 主页面组件
 */
const LoveMajorSchool: React.FC = () => {
  const [searchParams] = useSearchParams();
  const schoolName = searchParams.get('schoolName');
  const schoolCode = searchParams.get('schoolCode');
  const [majordwSelected, setMajordwSelected] = useState({
    title: '',
    majordwSelecteds: [],
  });

  //+5--5
  const [tuijianSchools1, setTuijianSchools1] = useState([]);
  //-15- -5
  const [tuijianSchools2, setTuijianSchools2] = useState([]);
  //5--10
  const [tuijianSchools3, setTuijianSchools3] = useState([]);
  //其他位次院校
  const [tuijianSchools4, setTuijianSchools4] = useState([]);

  const navigator = useNavigate();

  useEffect(() => {
    //获取院校信息
    const getSchools = async (schoolCode: string) => {
      if (!schoolCode) {
        console.error('未找到学校代码');
        return;
      }
      //  setSchoolLoading(true);
      try {
        const response = await getSchoolDetail(schoolCode);
        if (response && response.code === 200) {
          console.log(response.data);
          if (response.data.majors) {
            setTuijianSchools1(
              response.data.majors.filter((s) => s.group === 2).sort((a, b) => b.score - a.score)
            );
            setTuijianSchools2(
              response.data.majors.filter((s) => s.group === 3).sort((a, b) => b.score - a.score)
            );
            setTuijianSchools3(
              response.data.majors.filter((s) => s.group === 1).sort((a, b) => b.score - a.score)
            );
            setTuijianSchools4(
              response.data.majors.filter((s) => s.group === 0).sort((a, b) => b.score - a.score)
            );
          }
        }
      } catch (error) {
        console.error('获取院校信息失败:', error);
      } finally {
        // setSchoolLoading(false);
      }
    };
    getSchools(schoolCode);
  }, [schoolCode]);

  //获取前百分之多少的专业
  const geiQianBaifenZhi = (majors: any[], baifen: number = 0.01) => {
    if (majors && majors.length > 0) {
      const total = majors.length;
      let onePercent = total * baifen;
      onePercent = onePercent < 1 ? 1 : onePercent;
      if (total <= baifen * 100) onePercent = total;
      return majors.slice(0, onePercent);
    }
    return [];
  };

  const renderSchool = (major) => {
    return (
      <div key={major.name} className="py-1 border-b last:border-b-0">
        {/* 专业 */}
        <div className="flex items-center justify-between cursor-pointer">
          <span className="flex-1">
            <span className="text-base mr-2">{major.code}</span>
            <span className="text-base mr-5">{major.name}</span>
          </span>
          <span className="text-base mr-5">热爱能量 {Math.ceil(major.score * 100)} 分 ！</span>
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

  if (majordwSelected.title && majordwSelected.majordwSelecteds.length > 0) {
    return (
      <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
        <Top
          title={schoolName}
          onBack={() => {
            if (majordwSelected.majordwSelecteds.length > 0) {
              setMajordwSelected({ title: '', majordwSelecteds: [] });
            } else {
              navigator(-1);
            }
          }}
        />
        <div className="bg-[#f7f7fa] flex flex-col justify-center items-start p-3">
          {/* 页面主卡片 */}
          <Card className="rounded-2xl w-full max-w-xl shadow" bodyStyle={{ padding: '24px 16px' }}>
            <div className="text-lg font-bold mb-2 flex items-center">
              <span className="w-1.5 h-4 bg-blue-500 rounded-sm mr-2 inline-block" />
              热爱专业 {tuijianSchools1.length + tuijianSchools2.length + tuijianSchools3.length} 个
            </div>

            {majordwSelected.majordwSelecteds.length > 0 &&
              renderSchoolTop(
                majordwSelected.title + ' (' + majordwSelected.majordwSelecteds.length + '个)'
              )}
            {/* 院校招生信息列表 */}
            <div className="w-full max-w-xl">
              {geiQianBaifenZhi(majordwSelected.majordwSelecteds, 0.01).length > 0 && (
                <div className="text-blue-500 flex items-center  justify-between font-medium mr-5 cursor-pointer">
                  [“热爱能量”前1%专业]
                </div>
              )}
              {/* 模拟院校数据 */}
              {geiQianBaifenZhi(majordwSelected.majordwSelecteds, 0.01).map((school) =>
                renderSchool(school)
              )}
            </div>
            {/* 院校招生信息列表 */}
            <div className="w-full max-w-xl border-t border-gray-200 pt-2">
              {geiQianBaifenZhi(majordwSelected.majordwSelecteds, 0.1).length > 0 && (
                <div className="text-blue-500 flex items-center  justify-between font-medium mr-5 cursor-pointer">
                  [“热爱能量”前10%专业]
                </div>
              )}
              {/* 模拟院校数据 */}
              {geiQianBaifenZhi(majordwSelected.majordwSelecteds, 0.1).map((school) =>
                renderSchool(school)
              )}
            </div>

            {/* 院校招生信息列表 */}
            <div className="w-full max-w-xl border-t border-gray-200 pt-2">
              {geiQianBaifenZhi(majordwSelected.majordwSelecteds, 0.2).length > 0 && (
                <div className="text-blue-500 flex items-center  justify-between font-medium mr-5 cursor-pointer">
                  [“热爱能量”前20%专业]
                </div>
              )}
              {/* 模拟院校数据 */}
              {geiQianBaifenZhi(majordwSelected.majordwSelecteds, 0.2).map((school) =>
                renderSchool(school)
              )}
            </div>
          </Card>
        </div>
        {/* 底部导航 */}
        <BottomNav selectedIndex={1} />
      </div>
    );
  }

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
            renderSchoolTop(
              '比您高考分低5%到高5%位次段专业 (' +
                geiQianBaifenZhi(tuijianSchools1, 0.01).length +
                '个)'
            )}
          {/* 院校招生信息列表 */}
          <div className="w-full max-w-xl">
            {tuijianSchools1 && tuijianSchools1.length > 0 && (
              <div className="text-blue-500 flex items-center  justify-between font-medium mr-5 cursor-pointer">
                [“热爱能量”前1%专业]{' '}
                <span
                  className="underline  hover:text-green-600"
                  onClick={() =>
                    setMajordwSelected({
                      title: '比您高考分低5%到高5%位次段专业',
                      majordwSelecteds: tuijianSchools1,
                    })
                  }
                >
                  查看更多{'>>'}
                </span>
              </div>
            )}
            {/* 模拟院校数据 */}
            {geiQianBaifenZhi(tuijianSchools1, 0.01).map((school) => renderSchool(school))}
          </div>
          {tuijianSchools2.length > 0 &&
            renderSchoolTop('比您高考分低15%到5%位次段专业 (' + tuijianSchools2.length + '个)')}
          {/* 院校招生信息列表 */}
          <div className="w-full max-w-xl">
            {tuijianSchools2 && tuijianSchools2.length > 0 && (
              <div className="text-blue-500 flex items-center  justify-between font-medium mr-5 cursor-pointer">
                [“热爱能量”前1%专业]{' '}
                <span
                  className="underline  hover:text-green-600"
                  onClick={() =>
                    setMajordwSelected({
                      title: '比您高考分低15%到5%位次段专业',
                      majordwSelecteds: tuijianSchools2,
                    })
                  }
                >
                  查看更多{'>>'}
                </span>
              </div>
            )}
            {/* 模拟院校数据 */}
            {geiQianBaifenZhi(tuijianSchools2, 0.01).map((school) => renderSchool(school))}
          </div>
          {tuijianSchools3.length > 0 &&
            renderSchoolTop('比您高考分高5%到10%位次段专业 (' + tuijianSchools3.length + '个)')}
          {/* 院校招生信息列表 */}
          <div className="w-full max-w-xl">
            {tuijianSchools3 && tuijianSchools3.length > 0 && (
              <div className="text-blue-500 flex items-center  justify-between font-medium mr-5 cursor-pointer">
                [“热爱能量”前1%专业]{' '}
                <span
                  className="underline  hover:text-green-600"
                  onClick={() =>
                    setMajordwSelected({
                      title: '比您高考分高5%到10%位次段专业',
                      majordwSelecteds: tuijianSchools3,
                    })
                  }
                >
                  查看更多{'>>'}
                </span>
              </div>
            )}
            {/* 模拟院校数据 */}
            {geiQianBaifenZhi(tuijianSchools3, 0.01).map((school) => renderSchool(school))}
          </div>
          {tuijianSchools4.length > 0 &&
            renderSchoolTop('其他位次段专业 (' + tuijianSchools4.length + '个)')}
          {/* 院校招生信息列表 */}
          <div className="w-full max-w-xl">
            {/* 模拟院校数据 */}
            {tuijianSchools4.map((school) => renderSchool(school))}
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
    </div>
  );
};

export default LoveMajorSchool;
