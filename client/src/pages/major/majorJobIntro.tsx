// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card, Divider } from 'antd';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMajorDetail, getMajorBrief, getSchoolDetail } from '../../config';
import Top from '../comm/top';

const MajorJobIntro: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigator = useNavigate();
  const majorCode = searchParams.get('majorCode');
  const majorName = searchParams.get('majorName');
  const score = searchParams.get('score');
  const majorType = searchParams.get('type');
  const [majorDetail, setMajorDetail] = useState<any>(null);

  useEffect(() => {
    const fetchMajorDetail = async () => {
      try {
        if (!majorCode || !score) {
          console.error('未找到专业代码');
          return;
        }

        const detailResponse = await getMajorDetail(majorCode);

        if (detailResponse && detailResponse.code === 200) {
          if (detailResponse.data) {
            console.log(detailResponse.data);
            setMajorDetail(detailResponse.data);
          }
        }
      } catch (error) {
        console.error('获取专业详细信息失败:', error);
      } finally {
      }
    };

    fetchMajorDetail();
  }, [searchParams]);

  const getMajorBriefHtml = (majorBrief: string, defaultStr: string, jobNum: number = 1) => {
    if (majorBrief) {
      majorBrief = majorBrief.replace(/'/g, '"');
      const seniorTalkList = JSON.parse(majorBrief);
      console.log(jobNum);
      let html = '',
        showNum = '',
        index = 1;
      for (const [key, value] of Object.entries(seniorTalkList)) {
        if (majorType === 'major' || (majorType !== 'major' && index == jobNum)) {
          if (majorType === 'major') {
            showNum = index + '.';
          } else {
            showNum = '';
          }
          html += `<div style="margin-bottom: 8px; line-height: 1.8;">
                  <span style="color: #1677ff; font-weight: 600; margin-right: 4px;">${showNum}</span>
                  <span style="color: #1677ff; font-weight: 500; font-size: 16px; margin-right: 8px;">${key}：</span>
                  ${value}
                </div>`;
        }

        index++;
      }

      return html;
    } else {
      return defaultStr;
    }
  };

  // 自定义样式对象，部分样式可根据需要调整
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
  const numberStyle: React.CSSProperties = {
    color: '#1677ff',
    fontWeight: 600,
    marginRight: 4,
  };
  const subTitleStyle: React.CSSProperties = {
    color: '#1677ff',
    fontWeight: 500,
    fontSize: 16,
    marginRight: 8,
  };
  const listItemStyle: React.CSSProperties = {
    marginBottom: 8,
    lineHeight: 1.8,
  };

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title={majorCode + majorName} onBack={() => navigator(-1)} />
      <div className="bg-[#f7f7fa] flex justify-center items-start p-3">
        {/* 页面主卡片 */}
        <Card className="rounded-2xl w-full max-w-xl shadow" bodyStyle={{ padding: '24px 16px' }}>
          {/* 标题 */}
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 mb-3">
            <div className="text-lg font-bold" style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 4,
                  height: 20,
                  background: '#2563eb',
                  borderRadius: 2,
                  marginRight: 8,
                }}
              />
              {majorType == 'major' ? '专业简介' : '职业发展'}
            </div>
          </div>
          <div className="border border-solid border-[#e5e6eb] p-3">
            {/* 专业一览 */}
            <div style={{ marginBottom: 24 }}>
              <div style={sectionTitleStyle}>
                {' '}
                {majorType === 'major' ? '专业一览' : '就业去向'}
              </div>
              <div
                style={{ marginTop: 12 }}
                dangerouslySetInnerHTML={{
                  __html:
                    majorType === 'major'
                      ? majorDetail?.majorBrief
                      : getMajorBriefHtml(majorDetail?.careerDevelopment, '正在搜集中...', 1),
                }}
              ></div>
            </div>
            {/* 学什么？ */}
            <div style={{ marginBottom: 24 }}>
              <div style={sectionTitleStyle}>{majorType === 'major' ? '学什么？' : '薪酬水平'}</div>
              <div
                style={{ marginTop: 12 }}
                dangerouslySetInnerHTML={{
                  __html: getMajorBriefHtml(
                    majorType === 'major'
                      ? majorDetail?.studyContent
                      : majorDetail?.careerDevelopment,
                    '正在搜集中...',
                    majorType === 'major' ? 1 : 3
                  ),
                }}
              ></div>
            </div>
            {/* 学长学姐说 */}
            <div>
              <div style={sectionTitleStyle}>
                {majorType === 'major' ? '学长说' : '发展前景'}
              </div>
              <div
                style={{ marginTop: 12 }}
                dangerouslySetInnerHTML={{
                  __html: getMajorBriefHtml(
                    majorType === 'major'
                      ? majorDetail?.seniorTalk
                      : majorDetail?.careerDevelopment,
                    '正在搜集中...',
                    majorType === 'major' ? 1 : 4
                  ),
                }}
              ></div>
            </div>{' '}
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
    </div>
  );
};

export default MajorJobIntro;
