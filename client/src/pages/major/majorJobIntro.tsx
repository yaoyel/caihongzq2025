// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from 'antd';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMajorDetail } from '../../config';
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
      }
    };

    fetchMajorDetail();
  }, [searchParams]);

  /**
   * 递归处理嵌套的数据结构，生成HTML内容
   * @param data 要处理的数据
   * @param level 当前层级，用于缩进
   * @returns 生成的HTML字符串
   */
  const processDataToHtml = (data: any, level: number = 0): string => {
    if (typeof data === 'string') {
      return data;
    } else if (Array.isArray(data)) {
      return data.map((item) => processDataToHtml(item, level + 1)).join('<br/>');
    } else if (typeof data === 'object' && data !== null) {
      let html = '';
      for (const [key, value] of Object.entries(data)) {
        const indent = '&nbsp;'.repeat(level * 2);
        if (typeof value === 'string' || Array.isArray(value)) {
          html += `<div style="margin-bottom: 8px; line-height: 1.8;">
                    <span style="color: #1677ff; font-weight: 500; font-size: 16px; margin-right: 8px;">${indent}${key}：</span>
                    ${processDataToHtml(value, level + 1)}
                  </div>`;
        } else if (typeof value === 'object' && value !== null) {
          html += `<div style="margin-bottom: 8px; line-height: 1.8;">
                    <span style="color: #1677ff; font-weight: 500; font-size: 16px; margin-right: 8px;">${indent}${key}：</span>
                    ${processDataToHtml(value, level + 1)}
                  </div>`;
        }
      }
      return html;
    }
    return String(data);
  };

  const getMajorBriefHtml = (
    majorBrief: string,
    defaultStr: string,
    jobNum: number = 1,
    targetField?: string
  ) => {
    if (majorBrief) {
      try {
        majorBrief = majorBrief.replace(/'/g, '"');
        const seniorTalkList = JSON.parse(majorBrief);
        console.log(seniorTalkList);
        let html = '',
          showNum = '',
          index = 1;

        for (const [key, value] of Object.entries(seniorTalkList)) {
          // 如果是专业类型，显示所有内容；如果是职业类型，根据目标字段或索引显示
          const shouldShow =
            majorType === 'major' ||
            (majorType !== 'major' && (targetField ? key === targetField : index === jobNum));

          if (shouldShow) {
            if (majorType === 'major') {
              showNum = index + '.';
            } else {
              showNum = '';
            }

            html += `<div style="margin-bottom: 8px; line-height: 1.8;">
                    <span style="color: #1677ff; font-weight: 600; margin-right: 4px;">${showNum}</span>
                    <span style="color: #1677ff; font-weight: 500; font-size: 16px; margin-right: 8px;">${key}：</span>
                    ${processDataToHtml(value)}
                  </div>`;
          }
          index++;
        }
        console.log(html);
        return html;
      } catch (error) {
        console.error('解析专业简介数据失败:', error);
        return defaultStr;
      }
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
                {majorType === 'major' ? '做什么？' : '就业去向'}
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
                {majorType === 'major' ? '好升学么？' : '产业前景'}
              </div>
              <div
                style={{ marginTop: 12 }}
                dangerouslySetInnerHTML={{
                  __html: getMajorBriefHtml(
                    majorType === 'major'
                      ? majorDetail?.academicDevelopment
                      : majorDetail?.industryProspects,
                    '正在搜集中...',
                    majorType === 'major' ? 1 : 4,
                    majorType === 'major' ? undefined : '行业前景'
                  ),
                }}
              ></div>
            </div>
                         {/* 成长空间 */}
             {majorType !== 'major' && (
               <div>
                 <div style={sectionTitleStyle}>成长空间</div>
                 <div
                   style={{ marginTop: 12 }}
                   dangerouslySetInnerHTML={{
                     __html: getMajorBriefHtml(
                       majorDetail?.growthPotential,
                       '正在搜集中...',
                       majorType === 'major' ? 1 : 4,
                       majorType === 'major' ? undefined : '横向发展可能'
                     ),
                   }}
                 ></div>
               </div>
             )}
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
    </div>
  );
};

export default MajorJobIntro;
