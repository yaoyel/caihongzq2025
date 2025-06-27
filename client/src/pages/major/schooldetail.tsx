// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Top from '../comm/top';
import { Card } from 'antd';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSchoolDetail } from '../../config';
/**
 * 主页面组件
 */
const SchoolDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const schoolCode = searchParams.get('schoolCode');
  const schoolName = searchParams.get('schoolname');
  const navigator = useNavigate();
  const [schoolDetailInfo, setSchoolDetail] = useState(null);
  const sectionTitleStyle: React.CSSProperties = {
    background: '#2d6cf6',
    color: '#ffffff',
    fontWeight: 600,
    borderRadius: 8,
    padding: '4px 16px',
    display: 'inline-block',
    marginBottom: 16,
    fontSize: 18,
  };

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
          setSchoolDetail(response.data);
          console.log(response.data);
        }
      } catch (error) {
        console.error('获取院校信息失败:', error);
      } finally {
        // setSchoolLoading(false);
      }
    };
    getSchools(schoolCode);
  }, [schoolCode]);

  const getSchoolHtml = (schoolBrief: string) => {
    if (schoolBrief) {
      schoolBrief = schoolBrief.replace(/'/g, '"');
      const seniorTalkList = JSON.parse(schoolBrief);
      let html = '';
      for (const [key, value] of Object.entries(seniorTalkList)) {
        html += `<p class="text-gray-700 leading-relaxed mb-4">${value}</p>`;
      }
      return html;
    } else {
      return '';
    }
  };

  //获取特色专业
  const getFeatureMajors = () => {
    const featureMajors = schoolDetailInfo?.majors?.filter(
      (item: any) => item.isNationalFeature || item.isProvinceFeature
    );
    if (featureMajors && featureMajors.length > 0) {
      const featureMajorsHtml = featureMajors.map((item: any) => {
        return <div key={item.code}>{item.name}</div>;
      });
      return (
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitleStyle}>特色专业</div>
          <div style={{ marginTop: 12 }}>{featureMajorsHtml}</div>
        </div>
      );
    } else {
      return '';
    }
  };

  //每个节点的Html渲染
  const getDisadvantages = (htmlData: string, titleStr: string) => {
    if (htmlData) {
      return (
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitleStyle}>{titleStr}</div>
          <div
            style={{ marginTop: 12 }}
            dangerouslySetInnerHTML={{
              __html: getSchoolHtml(htmlData),
            }}
          ></div>
        </div>
      );
    }

    return '';
  };

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title={schoolName} onBack={() => navigator(-1)} />
      <div className="bg-[#f7f7fa] flex flex-col justify-center items-start p-3">
        {/* 页面主卡片 */}
        <Card className="rounded-2xl w-full max-w-xl shadow" bodyStyle={{ padding: '24px 16px' }}>
          <div className="text-lg font-bold mb-2 flex items-center">
            <span className="w-1.5 h-4 bg-blue-500 rounded-sm mr-2 inline-block" />
            {schoolName}
          </div>
          <div className="border border-solid border-[#e5e6eb] p-3">
            {/* 专业一览 */}
            {getDisadvantages(schoolDetailInfo?.schoolDetail?.briefComment, '院校简介')}
            {/* 特色专业 */}
            {getFeatureMajors()}
            {/* 院校槽点 */}
            {getDisadvantages(schoolDetailInfo?.schoolDetail?.disadvantages, '院校槽点')}
            {/* 历史沿革 */}
            {getDisadvantages(schoolDetailInfo?.schoolDetail?.historyIntro, '历史沿革')}
            {/* 推荐理由 */}
            {getDisadvantages(schoolDetailInfo?.schoolDetail?.seniorRecommendations, '推荐理由')}
            {/* 热爱专业 */}
            <div style={{ marginBottom: 24 }}>
              <div style={sectionTitleStyle}>热爱专业</div>
              <div
                style={{ marginTop: 12 }}
                onClick={() =>
                  navigator(
                    `/major/loveMajorSchool?schoolName=${schoolName}&schoolCode=${schoolCode}`
                  )
                }
              >
                <div className="flex items-center justify-between  mb-2">
                  <span>1.+5%到-5%位次专业</span>
                  <span className="mr-2">{'>'}</span>
                </div>
                <div className=" flex items-center justify-between mb-2">
                  <span>2.-5% 到-15%位次专业</span>
                  <span className="mr-2">{'>'}</span>
                </div>
                <div className=" flex items-center justify-between mb-2">
                  <span>3.+5%到+10%位次专业</span>
                  <span className="mr-2">{'>'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
    </div>
  );
};

export default SchoolDetail;
