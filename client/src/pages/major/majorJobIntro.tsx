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
  const anchor = searchParams.get('anchor'); // 获取锚点参数
  const [majorDetail, setMajorDetail] = useState<any>(null);

  useEffect(() => {
    const fetchMajorDetail = async () => {
      try {
        if (!majorCode || !score) {
          return;
        }

        const detailResponse = await getMajorDetail(majorCode);

        if (detailResponse && 'code' in detailResponse && detailResponse.code === 200) {
          if (detailResponse.data) {
            setMajorDetail(detailResponse.data);
          }
        }
      } catch (error) {
        // 静默处理错误
      }
    };

    fetchMajorDetail();
  }, [searchParams]);

  // 处理锚点定位
  useEffect(() => {
    if (anchor && majorDetail) {
      console.log('锚点定位触发:', anchor); // 调试信息
      // 延迟执行，确保DOM已渲染
      setTimeout(() => {
        let targetSection: HTMLElement | null = null;

        if (anchor === 'academic') {
          targetSection = document.getElementById('academic-section');
        } else if (anchor === 'growth') {
          targetSection = document.getElementById('growth-section');
        } else if (anchor === 'industry') {
          // 产业前景部分在非专业模式下使用academic-section的ID
          targetSection = document.getElementById('academic-section');
        } else if (anchor === 'career') {
          targetSection = document.getElementById('career-section');
        } else if (anchor === 'overview') {
          targetSection = document.getElementById('overview-section');
        }

        console.log('目标元素:', targetSection); // 调试信息

        if (targetSection) {
          // 临时设置scroll-margin-top来控制偏移量
          const originalScrollMargin = targetSection.style.scrollMarginTop;
          targetSection.style.scrollMarginTop = '60px'; // 40px导航栏 + 20px额外偏移

          // 使用scrollIntoView方法
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });

          // 滚动完成后恢复原始样式
          setTimeout(() => {
            targetSection.style.scrollMarginTop = originalScrollMargin;
          }, 1000);
        } else {
          console.log('未找到目标元素，anchor:', anchor); // 调试信息
        }
      }, 800); // 增加延迟时间
    }
  }, [anchor, majorDetail]);

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
      // 处理数组类型，为每个元素添加序号
      return data
        .map((item, index) => {
          const subContent = processDataToHtml(item, level + 1);
          return `<div style="margin-left: ${level * 16}px; margin-bottom: 4px;">
                  <span style="color: #666; margin-right: 8px;">${index + 1}.</span>
                  ${subContent}
                </div>`;
        })
        .join('');
    } else if (typeof data === 'object' && data !== null) {
      let html = '';
      for (const [key, value] of Object.entries(data)) {
        const subContent = processDataToHtml(value, level + 1);

        // 根据层级调整样式
        if (level === 0) {
          // 顶级标题使用蓝色
          html += `<div style="margin-bottom: 12px; line-height: 1.8;">
                    <span style="color: #1677ff; font-weight: 600; font-size: 16px; margin-right: 8px;">${key}：</span>
                    ${subContent}
                  </div>`;
        } else {
          // 子级标题使用较浅的颜色
          html += `<div style="margin-left: ${level * 16}px; margin-bottom: 8px; line-height: 1.8;">
                    <span style="color: #4096ff; font-weight: 500; font-size: 14px; margin-right: 8px;">${key}：</span>
                    ${subContent}
                  </div>`;
        }
      }
      return html;
    }
    return String(data);
  };

  const getMajorBriefHtml = (majorBrief: any, defaultStr: string) => {
    // 如果majorBrief是对象类型，直接使用processDataToHtml处理
    if (majorBrief && typeof majorBrief === 'object') {
      try {
        const html = processDataToHtml(majorBrief);
        return html || defaultStr;
      } catch (error) {
        return defaultStr;
      }
    }

    // 如果majorBrief是字符串类型，按原来的逻辑处理
    if (majorBrief && typeof majorBrief === 'string') {
      try {
        majorBrief = majorBrief.replace(/'/g, '"');

        const seniorTalkList = JSON.parse(majorBrief);

        let html = '',
          showNum = '',
          index = 1;

        for (const [key, value] of Object.entries(seniorTalkList)) {
          showNum = index + '.';

          html += `<div style="margin-bottom: 8px; line-height: 1.8;">
                    <span style="color: #1677ff; font-weight: 600; margin-right: 4px;">${showNum}</span>
                    <span style="color: #1677ff; font-weight: 500; font-size: 16px; margin-right: 8px;">${key}：</span>
                    ${processDataToHtml(value)}
                  </div>`;

          index++;
        }
        return html || defaultStr; // 如果html为空，返回默认字符串
      } catch (error) {
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
      <Top title={(majorCode || '') + (majorName || '')} onBack={() => navigator(-1)} />
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
            {majorType === 'major' && (
              <div id="overview-section" style={{ marginBottom: 24 }}>
                <div style={sectionTitleStyle}>做什么？</div>
                <div
                  style={{ marginTop: 12 }}
                  dangerouslySetInnerHTML={{
                    __html:
                      majorType === 'major'
                        ? majorDetail?.majorBrief
                        : getMajorBriefHtml(majorDetail?.careerDevelopment, '正在搜集中...'),
                  }}
                ></div>
              </div>
            )}
            {/* 学什么？ */}
            <div id="career-section" style={{ marginBottom: 24 }}>
              <div style={sectionTitleStyle}>{majorType === 'major' ? '学什么？' : '职业回报'}</div>
              <div
                style={{ marginTop: 12 }}
                dangerouslySetInnerHTML={{
                  __html: getMajorBriefHtml(
                    majorType === 'major'
                      ? majorDetail?.studyContent
                      : majorDetail?.careerDevelopment,
                    '正在搜集中...'
                  ),
                }}
              ></div>
            </div>
            {/* 学长学姐说 */}
            <div id="academic-section">
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
                    '正在搜集中...'
                  ),
                }}
              ></div>
            </div>
            {/* 成长空间 */}
            {majorType !== 'major' && (
              <div id="growth-section">
                <div style={sectionTitleStyle}>成长空间</div>
                <div
                  style={{ marginTop: 12 }}
                  dangerouslySetInnerHTML={{
                    __html: getMajorBriefHtml(majorDetail?.growthPotential, '正在搜集中...'),
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
