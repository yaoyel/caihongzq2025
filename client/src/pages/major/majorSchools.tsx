// @ts-nocheck
import React from 'react';
import Top from '../comm/top';
import { Card } from 'antd';
import BottomNav from '../comm/bottom';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * 主页面组件
 */
const MajorSchools: React.FC = () => {
  const [searchParams] = useSearchParams();
  const majorCode = searchParams.get('majorCode');
  const majorName = searchParams.get('majorName');
  const type = searchParams.get('type');
  console.log(majorCode, majorName, type, 'majorCode, majorName, type');
  const navigator = useNavigate();
  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title={`${majorCode ?? ''}${majorName ?? ''}`} onBack={() => navigator(-1)} />
      <div className="bg-[#f7f7fa] flex flex-col justify-center items-start p-3">
        {/* 页面主卡片 */}
        <Card className="rounded-2xl w-full max-w-xl shadow" bodyStyle={{ padding: '24px 16px' }}>
          <div className="text-lg font-bold mb-2 flex items-center">
            <span className="w-1.5 h-4 bg-blue-500 rounded-sm mr-2 inline-block" />
            招生院校 58所
          </div>
          <div
            style={{
              background: '#2563ff', // 设计图蓝色
              borderRadius: '12px 12px 0 0', // 顶部两个圆角
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '12px',
            }}
          >
            比您高考分高5%到10%位次段院校
          </div>
          {/* 院校招生信息列表 */}
          <div className="w-full max-w-xl">
            {/* 模拟院校数据 */}
            {[
              {
                name: '北京大学',
                tags: ['985', '211', '双一流'],
                data: [
                  { year: '2024年', score: '638分', rank: '第51位次', count: '招生50名' },
                  { year: '2023年', score: '638分', rank: '第51位次', count: '招生30名' },
                  { year: '2022年', score: '638分', rank: '第51位次', count: '招生40名' },
                ],
              },
              {
                name: '清华大学',
                tags: ['985', '211', '双一流'],
                data: [
                  { year: '2024年', score: '638分', rank: '第51位次', count: '招生50名' },
                  { year: '2023年', score: '638分', rank: '第51位次', count: '招生30名' },
                  { year: '2022年', score: '638分', rank: '第51位次', count: '招生40名' },
                ],
              },
            ].map((school) => (
              <div key={school.name} className="py-3 border-b last:border-b-0">
                {/* 院校头部 */}
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <span className="text-blue-600 font-bold text-base mr-2">{school.name}</span>
                    {school.tags.map((tag) => (
                      <span key={tag} className="text-blue-600 text-sm font-bold mr-2">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-400 text-lg">&gt;</span>
                </div>
                {/* 招生数据 */}
                <div className="mt-2 space-y-1">
                  {school.data.map((item, i) => (
                    <div
                      key={i}
                      className="flex text-sm text-gray-700"
                      onClick={() =>
                        navigator(
                          `/major/schooldetail?majorCode=${majorCode}&majorName=${majorName}&type=schools`
                        )
                      }
                    >
                      <span className="w-14">{item.year}</span>
                      <span className="w-14">{item.score}</span>
                      <span className="w-20">{item.rank}</span>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* 查看更多按钮 */}
          <div className="w-full flex justify-center mt-4">
            <button className="bg-blue-500 text-white px-6 py-1.5 rounded-full text-base font-bold shadow">
              查看更多
            </button>
          </div>
        </Card>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
    </div>
  );
};

export default MajorSchools;
