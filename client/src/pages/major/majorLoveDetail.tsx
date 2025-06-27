// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card, Button } from 'antd';
import { Dialog } from 'antd-mobile';
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

const MajorLoveDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigator = useNavigate();
  const majorCode = searchParams.get('majorCode');
  const score = searchParams.get('score');
  const majorName = searchParams.get('majorName');
  const lexueScore = searchParams.get('lexueScore');
  const shanxueScore = searchParams.get('shanxueScore');
  const yanxueDeduction = searchParams.get('yanxueDeduction');
  const tiaozhanDeduction = searchParams.get('tiaozhanDeduction');
  const [majorDetail, setMajorDetail] = useState<any>(null);
  // 收藏状态（静态展示，可后续接入逻辑）
  const [collected, setCollected] = React.useState(false);

  //+5--5
  const [tuijianSchools1, setTuijianSchools1] = useState([]);
  //-15- -5
  const [tuijianSchools2, setTuijianSchools2] = useState([]);
  //5--10
  const [tuijianSchools3, setTuijianSchools3] = useState([]);

  // 切换收藏状态
  const handleCollect = () => {
    setCollected(!collected);
  };

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
            if (detailResponse.data.schools) {
              setTuijianSchools1(detailResponse.data.schools.filter((s) => s.group === 2));
              setTuijianSchools2(detailResponse.data.schools.filter((s) => s.group === 3));
              setTuijianSchools3(detailResponse.data.schools.filter((s) => s.group === 1));
            }
          }
        }
      } catch (error) {
        console.error('获取专业详细信息失败:', error);
      } finally {
      }
    };

    fetchMajorDetail();
  }, [searchParams]);

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="最爱专业" onBack={() => navigator(-1)} />
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
                  <StarFilled className="text-[#bdbdbd] text-xl" />
                ) : (
                  <StarOutlined className="text-[#bdbdbd] text-xl" />
                )
              }
              onClick={handleCollect}
            >
              <span className="text-[#bdbdbd] ml-1">收藏</span>
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
                text={'乐学特质' + Math.ceil(Number(lexueScore || '0') * 100) + '分'}
                onClick={() =>
                  navigator(
                    `/major/studyTrait?type=lexue&majorCode=${majorCode}&majorName=${majorName}`
                  )
                }
              />
              <CardItem
                text={'善学特质' + Math.ceil(Number(shanxueScore || '0') * 100) + '分'}
                onClick={() =>
                  navigator(
                    `/major/studyTrait?type=shanxue&majorCode=${majorCode}&majorName=${majorName}`
                  )
                }
              />
              <CardItem
                text={'厌学特质' + Math.ceil(Number(yanxueDeduction || '0') * 100) + '分'}
                onClick={() =>
                  navigator(
                    `/major/studyTrait?type=yanxue&majorCode=${majorCode}&majorName=${majorName}`
                  )
                }
              />
              <CardItem
                text={'阻学特质' + Math.ceil(Number(tiaozhanDeduction || '0') * 100) + '分'}
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
                text="1.专业一览"
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
                text="3.学长说"
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
                  `/major/majorjobintro?type=job&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
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
                    `/major/majorjobintro?type=job&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
              <CardItem
                text="2.薪酬水平"
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=job&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  )
                }
              />
              <CardItem
                text="3.发展前景"
                onClick={() =>
                  navigator(
                    `/major/majorjobintro?type=job&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
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
            <div className="flex items-center mb-2 pb-2 border-b border-solid border-[#e5e6eb]">
              <img src={zhaoshengyuanxiao} alt="招生院校" className="w-7 h-7 mr-2" />
              <span className="text-[#2d6cf6] font-bold text-base">招生院校</span>
              <span className="text-[#2d6cf6] font-bold ml-2">
                {tuijianSchools1.length + tuijianSchools2.length + tuijianSchools3.length}所
              </span>
            </div>
            <div className="divide-y">
              <CardItem
                text={'1.+5%到-5%位次院校 (' + tuijianSchools1.length + ')所'}
                onClick={() => {
                  navigator(
                    `/major/majorSchools?type=schools&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  );
                }}
              />

              <CardItem
                text={'2.-5% 到-15%位次院校 (' + tuijianSchools2.length + ')所'}
                onClick={() => {
                  navigator(
                    `/major/majorSchools?type=schools&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  );
                }}
              />
              <CardItem
                text={'3.+5%到+10%位次院校 (' + tuijianSchools3.length + ')所'}
                onClick={() => {
                  navigator(
                    `/major/majorSchools?type=schools&majorCode=${majorCode}&majorName=${majorName}&score=${score}`
                  );
                }}
              />
            </div>
          </Card>
        </Card>
        {/* 底部导航 */}
        <BottomNav selectedIndex={1} />
      </div>
    </div>
  );
};

/**
 * 卡片列表项组件
 * @param text 列表项文本
 * @param onClick 点击事件处理函数
 */
const CardItem: React.FC<{ text: string; onClick?: () => void }> = ({ text, onClick }) => (
  <div
    className="flex items-center justify-between py-2 px-1 cursor-pointer hover:bg-gray-50"
    onClick={onClick}
  >
    <span className="text-[#3b3b3b] text-sm">{text}</span>
    <RightOutlined className="text-[#bdbdbd] text-base" />
  </div>
);

export default MajorLoveDetail;
