// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card, Button, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StarOutlined, StarFilled, RightOutlined } from '@ant-design/icons';
import './list.css'; // 可根据需要自定义样式
import reainengliang from '../../public/reainengliang.png';
import zhuanyejianjie from '../../public/zhuanyejianjie.png';
import zhiyefazhan from '../../public/zhiyefazhan.png';
import zhaoshengyuanxiao from '../../public/zhaoshengyuanxiao.png';
import BottomNav from '../comm/bottom';
import { getMajorDetail } from '../../config';
import Top from '../comm/top';
import { toggleMajorIntention, cancelMajorIntention } from '../../config/volunteer';

const MajorLoveDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigator = useNavigate();
  const majorCode = searchParams.get('majorCode');
  const score = searchParams.get('score');
  const [majorDetail, setMajorDetail] = useState<any>(null);
  const majorName = searchParams.get('majorName');

  const isFavorite = searchParams.get('isFavorite');
  console.log(isFavorite, 'isFavorite');

  // 收藏状态（静态展示，可后续接入逻辑）
  const [collected, setCollected] = useState(isFavorite === 'true');

  /**
   * 处理返回按钮点击
   */
  const handleBack = () => {
    // 确保滚动位置数据存在，这样列表页就知道是从详情页返回的
    if (!sessionStorage.getItem('major-list-scroll-position')) {
      sessionStorage.setItem('major-list-scroll-position', '0');
    }
    navigator(-1);
  };

  /**
   * 切换收藏状态
   */
  const handleCollect = async () => {
    try {
      let response;
      if (collected) {
        // 当前已收藏，执行取消收藏
        response = await cancelMajorIntention(majorCode || '');
        if (response && response.code === 200) {
          setCollected(!collected);
        }
      } else {
        // 当前未收藏，执行收藏
        response = await toggleMajorIntention(majorCode || '');
        if (response && response.code === 200) {
          setCollected(!collected);
        }
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      message.error('操作失败，请重试');
    }
  };

  useEffect(() => {
    const fetchMajorDetail = async () => {
      try {
        if (!majorCode || !score) {
          console.error('未找到专业代码');
          return;
        }

        const detailResponse = await getMajorDetail(majorCode);

        if (detailResponse && (detailResponse as any).code === 200) {
          if ((detailResponse as any).data) {
            const majorDetailData = {
              ...(detailResponse as any).data,
              tuijianSchools1: (detailResponse as any).data.tuijianSchools1,
              tuijianSchools2: (detailResponse as any).data.tuijianSchools2,
              tuijianSchools3: (detailResponse as any).data.tuijianSchools3,
              tuijianSchools4: (detailResponse as any).data.tuijianSchools4,
            };
            setMajorDetail(majorDetailData);
            console.log((detailResponse as any).data);
          }
        }
      } catch (error) {
        console.error('获取专业详细信息失败:', error);
      }
    };

    fetchMajorDetail();
  }, [searchParams]);

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="最爱专业" onBack={handleBack} />
      <div className="bg-[#f7f7fa] flex justify-center items-start p-3">
        {/* 外层大卡片 */}
        <Card className="rounded-2xl w-full max-w-xl shadow" bodyStyle={{ padding: '24px 16px' }}>
          {/* 顶部标题栏 */}
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
              {majorCode} {majorName}
            </div>
            <Button
              type="text"
              icon={
                collected ? (
                  <StarFilled className="text-[#fadb14] text-xl" />
                ) : (
                  <StarOutlined className="text-[#ccc] text-xl" />
                )
              }
              onClick={handleCollect}
            >
              <span className={collected ? 'text-[#fadb14]' : 'text-[#ccc]'}>收藏</span>
            </Button>
          </div>

          {/* 热爱能量卡片（白底+边框+圆角，无阴影） */}
          <Card className="rounded-xl mb-3 border border-solid border-[#e5e6eb] bg-white">
            <div className="flex items-center mb-2 pb-2 border-b border-solid border-[#e5e6eb]">
              <img src={reainengliang} alt="热爱能量" className="w-7 h-7 mr-2" />
              <span className="text-[#2d6cf6] font-bold text-base">热爱能量</span>
              <span className="text-[#2d6cf6] font-bold ml-2">
                {Math.ceil(Number(score || '0') * 100)}分
              </span>
            </div>
            <div className="divide-y">
              <CardItem
                text={
                  '乐学特质' + Math.ceil(Number(majorDetail?.major?.lexueScore || '0') * 100) + '分'
                }
                onClick={() =>
                  navigator(
                    `/major/studyTrait?type=lexue&majorCode=${majorCode}&majorName=${majorName}`
                  )
                }
              />
              <CardItem
                text={
                  '善学特质' +
                  Math.ceil(Number(majorDetail?.major?.shanxueScore || '0') * 100) +
                  '分'
                }
                onClick={() =>
                  navigator(
                    `/major/studyTrait?type=shanxue&majorCode=${majorCode}&majorName=${majorName}`
                  )
                }
              />
              <CardItem
                text={
                  '厌学特质' +
                  Math.ceil(Number(majorDetail?.major?.yanxueDeduction || '0') * 100) +
                  '分'
                }
                onClick={() =>
                  navigator(
                    `/major/studyTrait?type=yanxue&majorCode=${majorCode}&majorName=${majorName}`
                  )
                }
              />
              <CardItem
                text={
                  '阻学特质' +
                  Math.ceil(Number(majorDetail?.major?.tiaozhanDeduction || '0') * 100) +
                  '分'
                }
                onClick={() =>
                  navigator(
                    `/major/studyTrait?type=tiaozhan&majorCode=${majorCode}&majorName=${majorName}`
                  )
                }
              />
            </div>
          </Card>

          {/* 专业简介卡片 */}
          <Card
            className="rounded-xl mb-3 border border-solid border-[#e5e6eb] bg-white"
            bodyStyle={{ padding: '16px' }}
            bordered={true}
          >
            <div
              className="flex items-center mb-2 pb-2 border-b border-solid border-[#e5e6eb]"
              onClick={() =>
                navigator(
                  `/major/majorjobintro?type=major&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                )
              }
            >
              <img src={zhuanyejianjie} alt="专业简介" className="w-7 h-7 mr-2" />
              <span className="text-[#2d6cf6] font-bold text-base">专业简介</span>
            </div>
            <div className="divide-y">
              <CardItem
                text="1.做什么？"
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=major&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
              <CardItem
                text="2.学什么？"
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=major&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
              <CardItem
                text={'3.好升学么？' + Math.ceil(majorDetail?.academicDevelopmentScore) + '分'}
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=major&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
            </div>
          </Card>

          {/* 职业发展卡片 */}
          <Card
            className="rounded-xl mb-3 border border-solid border-[#e5e6eb] bg-white"
            bodyStyle={{ padding: '16px' }}
            bordered={true}
          >
            <div
              className="flex items-center mb-2 pb-2 border-b border-solid border-[#e5e6eb]"
              onClick={() =>
                navigator(
                  `/major/majorjobintro?type=career&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                )
              }
            >
              <img src={zhiyefazhan} alt="职业发展" className="w-7 h-7 mr-2" />
              <span className="text-[#2d6cf6] font-bold text-base">职业发展</span>
            </div>
            <div className="divide-y">
              <CardItem
                text="1.就业去向"
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=career&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
              <CardItem
                text={'2.薪酬水平' + Math.ceil(majorDetail?.careerDevelopmentScore) + '分'}
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=salary&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
              <CardItem
                text={'3.产业前景' + Math.ceil(majorDetail?.industryProspectsScore) + '分'}
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=prospect&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
              <CardItem
                text={'4.成长空间' + Math.ceil(majorDetail?.growthPotentialScore) + '分'}
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=prospect&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
            </div>
          </Card>

          {/* 招生院校卡片 */}
          <Card
            className="rounded-xl mb-3 border border-solid border-[#e5e6eb] bg-white"
            bodyStyle={{ padding: '16px' }}
            bordered={true}
          >
            <div
              className="flex items-center mb-2 pb-2 border-b border-solid border-[#e5e6eb]"
              onClick={() =>
                navigator(
                  `/major/majorschools?majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                )
              }
            >
              <img src={zhaoshengyuanxiao} alt="招生院校" className="w-7 h-7 mr-2" />
              <span className="text-[#2d6cf6] font-bold text-base">招生院校</span>
              <span className="text-[#2d6cf6] font-bold ml-2">
                {majorDetail?.schools?.filter((s) => s.group !== 0).length}所
              </span>
            </div>
            <div className="divide-y">
              <CardItem
                text={
                  '1.-10%到+5%位次院校 (' +
                  majorDetail?.schools?.filter((s) => s.group === 2).length +
                  ')所'
                }
                onClick={() => {
                  majorDetail?.schools?.filter((s) => s.group === 2).length > 0 &&
                    navigator(
                      `/major/majorSchools?type=schools&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                    );
                }}
              />

              <CardItem
                text={
                  '2.-30% 到-10%位次院校 (' +
                  majorDetail?.schools?.filter((s) => s.group === 3).length +
                  ')所'
                }
                onClick={() => {
                  majorDetail?.schools?.filter((s) => s.group === 3).length > 0 &&
                    navigator(
                      `/major/majorSchools?type=schools&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                    );
                }}
              />
              <CardItem
                text={
                  '3.+5%到+30%位次院校 (' +
                  majorDetail?.schools?.filter((s) => s.group === 1).length +
                  ')所'
                }
                onClick={() => {
                  majorDetail?.schools?.filter((s) => s.group === 1).length > 0 &&
                    navigator(
                      `/major/majorSchools?type=schools&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                    );
                }}
              />
              <CardItem
                text={
                  '4.其他位次院校 (' +
                  majorDetail?.schools?.filter((s) => s.group === 0).length +
                  ')所'
                }
                onClick={() => {
                  majorDetail?.schools?.filter((s) => s.group === 0).length > 0 &&
                    navigator(
                      `/major/majorSchools?type=schools&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                    );
                }}
              />
            </div>
          </Card>
        </Card>
      </div>
      <BottomNav selectedIndex={1} />
    </div>
  );
};

const CardItem: React.FC<{ text: string; onClick?: () => void }> = ({ text, onClick }) => (
  <div
    className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 transition-colors"
    onClick={onClick}
  >
    <span className="text-gray-700">{text}</span>
    <RightOutlined className="text-gray-400" />
  </div>
);

export default MajorLoveDetail;
