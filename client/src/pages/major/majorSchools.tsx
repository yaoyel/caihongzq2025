import React from 'react';
import Top from '../comm/top';
import BottomNav from '../comm/bottom';

/**
 * 招生院校列表页面组件
 * 严格按照设计图实现，展示院校名称、标签、年份分数、位次、招生人数等信息
 * @returns 招生院校页面
 */
const majorSchoolsData = [
  {
    schoolName: '北京大学',
    tags: ['985', '211', '双一流'],
    years: [
      { year: '2024年', score: '638分', rank: '第51位次', count: '招生50名' },
      { year: '2023年', score: '638分', rank: '第51位次', count: '招生30名' },
      { year: '2022年', score: '638分', rank: '第51位次', count: '招生40名' },
    ],
  },
  {
    schoolName: '清华大学',
    tags: ['985', '211', '双一流'],
    years: [
      { year: '2024年', score: '638分', rank: '第51位次', count: '招生50名' },
      { year: '2023年', score: '638分', rank: '第51位次', count: '招生30名' },
      { year: '2022年', score: '638分', rank: '第51位次', count: '招生40名' },
    ],
  },
  {
    schoolName: '中南大学',
    tags: ['985', '211', '双一流'],
    years: [
      { year: '2024年', score: '638分', rank: '第51位次', count: '招生50名' },
      { year: '2023年', score: '638分', rank: '第51位次', count: '招生30名' },
      { year: '2022年', score: '638分', rank: '第51位次', count: '招生40名' },
    ],
  },
  {
    schoolName: '湖南大学',
    tags: ['985', '211', '双一流'],
    years: [
      { year: '2024年', score: '638分', rank: '第51位次', count: '招生50名' },
      { year: '2023年', score: '638分', rank: '第51位次', count: '招生30名' },
      { year: '2022年', score: '638分', rank: '第51位次', count: '招生40名' },
    ],
  },
  {
    schoolName: '湖南师范大学',
    tags: ['211', '双一流'],
    years: [
      { year: '2024年', score: '638分', rank: '第51位次', count: '招生50名' },
      { year: '2023年', score: '600分', rank: '第1051位次', count: '招生30名' },
    ],
  },
];

/**
 * 标签组件，蓝色字体
 */
const SchoolTag: React.FC<{ text: string }> = ({ text }) => (
  <span style={{ color: '#2563eb', fontWeight: 500, marginRight: 8 }}>{text}</span>
);

/**
 * 单个院校卡片组件
 */
const SchoolCard: React.FC<{ school: (typeof majorSchoolsData)[0] }> = ({ school }) => (
  <div
    style={{
      borderBottom: '1px solid #eee',
      padding: '20px 0 10px 0',
      background: '#fff',
    }}
  >
    {/* 院校名称与标签 */}
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ color: '#2563eb', fontWeight: 600, fontSize: 20, marginRight: 12 }}>
        {school.schoolName}
      </span>
      {school.tags.map((tag) => (
        <SchoolTag key={tag} text={tag} />
      ))}
      {/* 右箭头 */}
      <span style={{ marginLeft: 'auto', color: '#bdbdbd', fontSize: 22 }}>&#8250;</span>
    </div>
    {/* 三年数据 */}
    <div style={{ marginLeft: 4 }}>
      {school.years.map((item) => (
        <div key={item.year} style={{ display: 'flex', gap: 24, marginBottom: 2, fontSize: 17 }}>
          <span style={{ color: '#222' }}>{item.year}</span>
          <span style={{ color: '#222' }}>{item.score}</span>
          <span style={{ color: '#222' }}>{item.rank}</span>
          <span style={{ color: '#222' }}>{item.count}</span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * 主页面组件
 */
const MajorSchools: React.FC = () => {
  // 分组模拟，实际可按需分组
  const group1 = majorSchoolsData.slice(0, 2);
  const group2 = majorSchoolsData.slice(2, 4);
  const group3 = majorSchoolsData.slice(4);

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title={`${majorCode ?? ''}${majorName ?? ''}`} onBack={() => navigator(-1)} />
      <div className="bg-[#f7f7fa] flex justify-center items-start p-3">
        {/* 标题栏 */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            padding: '18px 20px 10px 20px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 24,
                background: '#2563eb',
                borderRadius: 3,
                marginRight: 10,
              }}
            ></span>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#222' }}>招生院校58所</span>
          </div>
        </div>

        {/* 分组1 */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            padding: '0 20px',
          }}
        >
          {group1.map((school) => (
            <SchoolCard key={school.schoolName} school={school} />
          ))}
          {/* 查看更多按钮 */}
          <div style={{ textAlign: 'right', margin: '10px 0 10px 0' }}>
            <button
              style={{
                background: '#e8edfd',
                color: '#2563eb',
                border: 'none',
                borderRadius: 20,
                padding: '6px 22px',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              查看更多
            </button>
          </div>
        </div>

        {/* 分组2 */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            padding: '0 20px',
          }}
        >
          {group2.map((school) => (
            <SchoolCard key={school.schoolName} school={school} />
          ))}
          {/* 查看更多按钮 */}
          <div style={{ textAlign: 'right', margin: '10px 0 10px 0' }}>
            <button
              style={{
                background: '#e8edfd',
                color: '#2563eb',
                border: 'none',
                borderRadius: 20,
                padding: '6px 22px',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              查看更多
            </button>
          </div>
        </div>

        {/* 分组3 */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            padding: '0 20px',
          }}
        >
          {group3.map((school) => (
            <SchoolCard key={school.schoolName} school={school} />
          ))}
        </div>
      </div>
      {/* 底部导航 */}
      <BottomNav selectedIndex={1} />
    </div>
  );
};

export default MajorSchools;
