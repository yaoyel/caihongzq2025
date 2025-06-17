// @ts-nocheck
import '@fortawesome/fontawesome-free/css/all.min.css';
import React, { useState, useEffect } from 'react';
import { Button, Card, Tag, Tabs } from 'antd';
import { ArrowLeftOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMajorDetail, getMajorBrief } from '../../config';

const App: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('intro');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [majorDetail, setMajorDetail] = useState(null);
  const [majorBrief, setMajorBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const schools = [
    {
      id: '1',
      name: '清华大学',
      location: '北京市',
      tags: ['985', '211', '双一流'],
      intro: '清华大学创建于1911年，是一所世界知名的高等学府...',
      advantages: ['计算机科学', '人工智能', '电子工程'],
      labs: ['智能技术与系统国家重点实验室', '微纳电子技术研究中心'],
      reviews: [
        {
          content: '作为一名清华计算机系的学长，我觉得最大的收获是...',
          author: '王同学 2021级',
        },
      ],
      limitations: ['竞争压力大', '学习强度高'],
      admissionInfo: '2024年计划招生350人，综合评价录取...',
    },
    // 更多学校数据...
  ];
  const majorCode = searchParams.get('majorCode');
  const score = searchParams.get('score');
  const majorName = searchParams.get('majorName');
  const isLove = searchParams.get('isLove');
  useEffect(() => {
    const fetchMajorInfo = async () => {
      try {
        console.log(majorCode);
        if (!majorCode || !score) {
          console.error('未找到专业代码');
          return;
        }

        const briefResponse = await getMajorBrief(majorCode);

        if (briefResponse && briefResponse.code === 200) {
          setMajorBrief(briefResponse.data);
          console.log(briefResponse.data);
        }
      } catch (error) {
        console.error('获取专业信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMajorInfo();
  }, [searchParams]);

  const renderContent = () => {
    if (selectedSchool) {
      const school = schools.find((s) => s.id === selectedSchool);
      if (!school) return null;
      return (
        <div className="p-4">
          <div className="mb-6">
            <img
              src="https://ai-public.mastergo.com/ai/img_res/ba9ddbcae7fb4ea04386e5a1ddfee657.jpg"
              alt="校园风光"
              className="w-full h-48 object-cover rounded-lg shadow-md mb-4"
            />
            <div className="flex gap-2 mb-4">
              {school.tags.map((tag, index) => (
                <Tag key={index} color="green">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
          <Tabs
            defaultActiveKey="intro"
            items={[
              {
                key: 'intro',
                label: '学校简介',
                children: (
                  <div className="space-y-4">
                    <p className="text-gray-700">{school.intro}</p>
                  </div>
                ),
              },
              {
                key: 'advantages',
                label: '优势专业',
                children: (
                  <div className="grid grid-cols-2 gap-4">
                    {school.advantages.map((adv, index) => (
                      <Card key={index} className="shadow-sm">
                        <h4 className="font-medium">{adv}</h4>
                      </Card>
                    ))}
                  </div>
                ),
              },
              {
                key: 'labs',
                label: '重点实验室',
                children: (
                  <div className="space-y-4">
                    {school.labs.map((lab, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium">{lab}</h4>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }
    switch (activeSection) {
      case 'intro':
        return (
          <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h2 className="text-xl font-medium mb-4">{majorName}</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">专业介绍</h3>
              <p className="text-gray-700 leading-relaxed">
                <div
                  className="text-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <span>
                    <b>层次：</b>
                    {majorBrief?.educationLevel
                      ? majorBrief?.educationLevel === 'ben'
                        ? '本科'
                        : '其他'
                      : '其他'}
                  </span>
                  <span>
                    <b>学制：</b>
                    {majorBrief?.studyPeriod}
                  </span>
                  <span>
                    <b>学位：</b>
                    {majorBrief?.awardedDegree}
                  </span>
                </div>
                {majorBrief?.majorBrief ? majorBrief?.majorBrief : '专业介绍正在搜集中...'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">就业方向</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  {majorBrief?.careerDevelopment
                    ? majorBrief?.careerDevelopment
                    : '就业方向正在搜集中...'}
                </div>
              </div>
            </div>
          </div>
        );
      case 'schools':
        return (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索院校..."
                  className="w-full h-10 pl-10 pr-4 text-sm border-none rounded-lg bg-white shadow-sm focus:outline-none"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {schools.map((school) => (
                <Card
                  key={school.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-none"
                  onClick={() => setSelectedSchool(school.id)}
                  hoverable
                >
                  <h3 className="font-medium mb-2">{school.name}</h3>
                  <p className="text-gray-600 text-sm">{school.location}</p>
                  <div className="mt-2">
                    {school.tags.map((tag, index) => (
                      <Tag key={index} color="green">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'courses':
        return (
          <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h2 className="text-xl font-medium mb-4">本专业主修课程</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-700 leading-relaxed">
                {majorBrief?.studyContent ? majorBrief?.studyContent : '专业主修课程正在搜集中...'}
              </p>
            </div>
          </div>
        );
      case 'shares':
        return (
          <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h2 className="text-xl font-medium mb-4">学长分享</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-700 leading-relaxed">
                {majorBrief?.seniorTalk ? majorBrief?.seniorTalk : '学长分享正在搜集中...'}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 bg-white shadow-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="mr-2"
            onClick={() => navigate(-1)}
          />
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="mr-3"
          />
          <span className="text-lg font-medium text-center">{majorName}</span>
        </div>
      </div>

      {/* 分数展示 */}
      <div className="fixed top-14 left-0 right-0 bg-white shadow-sm z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">
              {majorCode} {majorName}
            </span>
            <div className="flex items-center">
              <span
                className={
                  isLove === 'true'
                    ? 'text-green-600 font-bold text-xl'
                    : 'text-red-600 font-bold text-xl'
                }
              >
                热爱能量 {Math.ceil(score * 100)}分！
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 pt-[110px]">
        <div
          className={`${sidebarCollapsed ? 'w-14' : 'w-[120px]'} bg-white shadow-sm fixed left-0 top-[110px] bottom-0 transition-all duration-300`}
        >
          <div className="flex flex-col py-4 space-y-2">
            <button
              className={`px-4 h-12 flex items-center justify-center ${
                activeSection === 'intro' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection('intro')}
            >
              <i className={`fas fa-file-alt text-base ${!sidebarCollapsed ? 'mr-3' : ''}`}></i>
              {!sidebarCollapsed && <span className="text-sm">专业介绍</span>}
            </button>
            <button
              className={`px-4 h-12 flex items-center justify-center ${
                activeSection === 'courses' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection('courses')}
            >
              <i className={`fas fa-book text-base ${!sidebarCollapsed ? 'mr-3' : ''}`}></i>
              {!sidebarCollapsed && <span className="text-sm">主修课程</span>}
            </button>
            <button
              className={`px-4 h-12 flex items-center justify-center ${
                activeSection === 'schools' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection('schools')}
            >
              <i className={`fas fa-school text-base ${!sidebarCollapsed ? 'mr-3' : ''}`}></i>
              {!sidebarCollapsed && <span className="text-sm">招生院校</span>}
            </button>
            <button
              className={`px-4 h-12 flex items-center justify-center ${
                activeSection === 'shares' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveSection('shares')}
            >
              <i className={`fas fa-users text-base ${!sidebarCollapsed ? 'mr-3' : ''}`}></i>
              {!sidebarCollapsed && <span className="text-sm">学长分享</span>}
            </button>
          </div>
        </div>
        <div
          className={`flex-1 ${sidebarCollapsed ? 'ml-14' : 'ml-[120px]'} transition-all duration-300`}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
export default App;
