// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Modal } from 'antd';
import Top from '../comm/top';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Radio, Space } from 'antd-mobile';
import { CheckCircleFill } from 'antd-mobile-icons';
import { getMajorDetail, getScalesByElementsWithAnswers } from '../../config';
import trait_icon from '../../public/trait_icon.png';
import './list.css'; // 假设复用专业列表样式，可根据需要自定义

import { color } from 'echarts';

const StudyTrait: React.FC = () => {
  const userStr = localStorage.getItem('new-user');
  const [searchParams] = useSearchParams();
  const navigator = useNavigate();
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [modalSelects, setModalSelects] = useState<any[]>([]);
  const [elementList, setElementList] = useState<any[]>([]);
  const [majorDetail, setMajorDetail] = useState<any>(null);
  const majorCode = searchParams.get('majorCode');
  const majorName = searchParams.get('majorName');
  const majorType = searchParams.get('type');
  const scoreToBigletters = (score: number) => {
    switch (score) {
      case 2:
        return 'A';
      case 1:
        return 'B';
      case 0:
        return 'C';
      case -1:
        return 'D';
      case -2:
        return 'E';
    }
  };
  useEffect(() => {
    const fetchMajorDetail = async () => {
      try {
        if (!majorCode) {
          console.error('未找到专业代码');
          return;
        }

        const detailResponse = await getMajorDetail(majorCode);

        if (detailResponse && detailResponse.code === 200) {
          if (detailResponse.data) {
            console.log(detailResponse.data);
            // 获取维度id
            let ids = '';
            detailResponse.data.majorElementAnalyses.map((item: any) => {
              ids += item.element.id + ',';
            });
            if (ids) {
              // 获取维度及问卷和答案
              const user = JSON.parse(userStr);
              const scaleResponse = await getScalesByElementsWithAnswers(
                ids,
                user?.id ?? user?.data?.id
              );
              if (scaleResponse && scaleResponse.code === 200) {
                const listTemp: any[] = [];
                scaleResponse.data.map((item: any) => {
                  if (item.options && item.options.length > 0) {
                    listTemp.push({
                      content: item.content,
                      elementId: item.elementId,
                      score: item.answers && scoreToBigletters(item.answers[0].score),
                      options: item.options,
                    });
                  }
                });
                if (listTemp.length > 0) {
                  setElementList(listTemp);
                }
              }
            }
          }
          setMajorDetail(detailResponse.data);
        }
      } catch (error) {
        console.error('获取专业详细信息失败:', error);
      }
    };

    fetchMajorDetail();
  }, [searchParams]);

  const handleModalOpen = (modalId: string, elementId: number) => {
    const newModalSelects: any[] = [];
    elementList &&
      elementList.map((item: any) => {
        if (item.elementId === elementId) {
          newModalSelects.push({
            name: item.content,
            options: item.options,
            score: item.score,
          });
        }
      });
    setModalSelects(newModalSelects);
    setSelectedModal(modalId);
  };
  const handleModalClose = () => {
    setSelectedModal(null);
  };

  // 获取我的自评分数
  const getMyScore = (elementId: string) => {
    let myScores = '';
    elementList.forEach((s: any) => {
      if (s.elementId === elementId) {
        myScores += s.score + '/';
      }
    });
    return myScores.slice(0, -1);
  };

  const getTitleInfo = () => {
    const titleInfo = {
      title: '',
      info: '',
    };
    switch (majorType) {
      case 'lexue':
        titleInfo.title = '乐学特质';
        titleInfo.info = '内在开心体验带来持续动力，无需外部激励与压力，自主学习与自愿投入。';
        break;
      case 'shanxue':
        titleInfo.title = '善学特质';
        titleInfo.info = '无师自通的规律发现、不学就会的行为走向，自然而然学得更快更好更轻松。';
        break;
      case 'yanxue':
        titleInfo.title = '厌学特质';
        titleInfo.info = '开心体验持续无法得到满足，导致动力衰减与积极性下降。';
        break;
      case 'tiaozhan':
        titleInfo.title = '阻学特质';
        titleInfo.info =
          '信息收集/储存/处理/应用模式，与高频学习工作场景所需模式冲突，导致效率损耗与自我怀疑。';
        break;
    }
    return titleInfo;
  };

  const getPotentialConversionValue = (value: string) => {
    switch (value) {
      case 'high':
        return { color: 'green', value: '高' };
      case 'medium':
        return { color: 'orange', value: '中' };
      case 'low':
        return { color: 'red', value: '低' };
    }
  };

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title={`${majorCode ?? ''}${majorName ?? ''}`} onBack={() => navigator(-1)} />
      <div className="bg-[#f7f7fa] flex flex-col justify-center items-start p-3">
        {/* 页面主卡片 */}
        <Card className="rounded-2xl w-full max-w-xl shadow" bodyStyle={{ padding: '24px 16px' }}>
          {/* 页面标题 */}
          <div className="text-lg font-bold mb-2 flex items-center">
            <span className="w-1.5 h-4 bg-blue-500 rounded-sm mr-2 inline-block" />
            {getTitleInfo().title}
          </div>
          {/* 简介段落 */}
          <div className="text-gray-700 text-sm mb-4">{getTitleInfo().info}</div>

          {/* 特质卡片列表 */}
          {majorDetail &&
            majorDetail.majorElementAnalyses
              ?.filter((trait) => trait.type === majorType)
              .map((trait, i) => {
                return (
                  <Card
                    key={trait.id}
                    className="mb-4 trait-card"
                    bodyStyle={{ padding: '18px 12px' }}
                  >
                    {/* 卡片头部整体：淡蓝色背景，圆角，内边距，下分隔线 */}
                    <div
                      className="flex items-center mb-2 px-3 py-2 rounded-t-lg"
                      style={{
                        background: '#e6edfa',
                        borderBottom: '1px solid #d3e0f3',
                        margin: '-18px -12px',
                      }}
                    >
                      {/* 绿色图标 */}
                      <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                        <img src={trait_icon} alt="trait_icon" className="w-6 h-6" />
                      </span>
                      <span className="font-bold text-base mr-2">特质{i + 1}</span>
                    </div>
                    <div className="text-gray-700 text-sm mt-7">{trait.summary}</div>
                    {/* 匹配维度 */}
                    <div className="mt-1 mb-1">
                      <span className="text-blue-600 flex items-center font-medium mr-2">
                        <CheckCircleFill className="mr-2" /> 匹配维度
                      </span>
                      <span className="text-gray-700 text-sm">
                        {trait.element.type === 'like' ? '喜欢-' : '天赋-'}
                        {trait.element.name}
                      </span>
                    </div>
                    {/* 维度状态（支持展开/收起） */}
                    <div className="mb-1">
                      <span className="text-blue-600 flex items-center font-medium">
                        <CheckCircleFill className="mr-2" />
                        {majorType === 'yanxue' ? '特质状态' : '维度状态'}
                      </span>
                      <div className="text-gray-700 text-sm mt-1">
                        <div>
                          1. 主动行为：
                          {majorType === 'yanxue' ? trait.element.status : trait.theoryBasis}
                        </div>
                        <div className="mt-1">
                          2. 我的自评：{getMyScore(trait.element.id)}
                          <a
                            className="text-blue-500 ml-2"
                            href="#"
                            style={{ textDecoration: 'underline' }}
                            onClick={() => handleModalOpen('modal1', trait.element.id)}
                          >
                            查看问卷内容&gt;
                          </a>
                        </div>
                      </div>
                    </div>
                    {/* 匹配原因 */}
                    <div className="mb-1">
                      <span className="text-blue-600 font-medium flex items-center">
                        <CheckCircleFill className="mr-2" />
                        {majorType === 'yanxue'
                          ? '厌学原因'
                          : majorType === 'tiaozhan'
                            ? '阻学原因'
                            : '匹配原因'}
                      </span>
                      <div className="text-gray-700 text-sm mt-1">{trait.matchReason}</div>
                    </div>

                    {(majorType === 'yanxue' || majorType === 'tiaozhan') && (
                      <div className="mb-1">
                        <span className="text-blue-600 font-medium flex items-center">
                          <CheckCircleFill className="mr-2" />
                          转化潜力
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              color: 'white',
                              fontWeight: 'bold',
                              marginLeft: 10,
                              width: 20,
                              height: 20,
                              textAlign: 'center',
                              borderRadius: '50%',
                              backgroundColor: getPotentialConversionValue(
                                trait.potentialConversionValue
                              ).color,
                            }}
                          >
                            {getPotentialConversionValue(trait.potentialConversionValue).value}
                          </span>
                        </span>
                        <div className="text-gray-700 text-sm mt-1">
                          {trait.potentialConversionReason}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}

          {/* 温馨提醒 */}
          <div className="p-3 text-xs text-gray-700 mt-2 ">
            <span className="font-bold text-blue-500 mr-1">温馨提醒：</span>
            "热爱度"分值受自我认知深入程度影响，特质研究也将持续深入，结果仅供参考，请结合实际情况综合考量。
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
      <Modal
        open={selectedModal !== null}
        title="问卷内容及您的自评"
        onCancel={handleModalClose}
        footer={[
          <button key="close" onClick={handleModalClose}>
            关闭
          </button>,
        ]}
        style={{ width: '90vw', maxWidth: '90vw' }}
      >
        <div className="p-4 text-gray-600 " style={{ display: 'flex', flexDirection: 'column' }}>
          {modalSelects &&
            modalSelects.length > 0 &&
            modalSelects.map((item: any, idx: number) => (
              <React.Fragment key={idx}>
                <div className="text-base mb-4">
                  {idx + 1}.{item.name}
                </div>
                <Radio.Group value={item.score}>
                  {item.options &&
                    item.options.map((option: any, oidx: number) => (
                      <Space direction="vertical" key={oidx}>
                        <Radio
                          value={scoreToBigletters(option.optionValue)}
                          className="text-sm mb-2"
                        >
                          {option.optionName}
                          {option.additionalInfo ? '（' + option.additionalInfo + '）' : ''}
                        </Radio>
                      </Space>
                    ))}
                </Radio.Group>
              </React.Fragment>
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default StudyTrait;
