// @ts-nocheck
import '@fortawesome/fontawesome-free/css/all.min.css';
import React, { useState, useEffect } from 'react';
import { Button, Card, Tag, Tabs } from 'antd';
import { ArrowLeftOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMajorDetail, getMajorBrief, getSchoolDetail } from '../../config';

const App: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('intro');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [majorDetail, setMajorDetail] = useState(null);
  const [majorBrief, setMajorBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schoolDetailInfo, setSchoolDetail] = useState(null);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

    const fetchMajorDetail = async () => {
      try {
        if (!majorCode || !score) {
          console.error('未找到专业代码');
          return;
        }

        const detailResponse = await getMajorDetail(majorCode);

        if (detailResponse && detailResponse.code === 200) {
          if (detailResponse.data.schools) {
            setSchools(detailResponse.data.schools);
          }
        }
      } catch (error) {
        console.error('获取专业详细信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMajorDetail();
  }, [searchParams]);

  //获取院校信息
  const getSchools = async (schoolCode: string) => {
    if (!majorCode) {
      console.error('未找到专业代码');
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
  const getMajorBriefHtml = (majorBrief: string, defaultStr: string) => {
    if (majorBrief) {
      majorBrief = majorBrief.replace(/'/g, '"');
      const seniorTalkList = JSON.parse(majorBrief);

      let html = '';
      for (const [key, value] of Object.entries(seniorTalkList)) {
        let htmlTemp = '';
        if (key === '典型岗位与工作内容') {
          // if (Array.isArray(value)) {
          //   for (const item of value) {
          //     console.log(item);
          //     htmlTemp += `<h3 class="text-sm font-medium mb-2">${item["岗位"]}：</h3><p class="text-gray-700 leading-relaxed mb-4">${item["内容"]}</p>`;
          //   }
          // } else {
          for (const [key1, value1] of Object.entries(value)) {
            htmlTemp += `<h3 class="text-sm font-medium mb-2">${key1}：</h3><p class="text-gray-700 leading-relaxed mb-4">${value1}</p>`;
          }
          // }
        }
        if (!htmlTemp) {
          htmlTemp = value;
        }
        html += `<h3 class="text-lg font-medium mb-2">${key}：</h3><p class="text-gray-700 leading-relaxed mb-4">${htmlTemp}</p>`;
      }

      return html;
    } else {
      return defaultStr;
    }
  };

  const filteredSchools = schools?.filter((school) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      school.name.toLowerCase().includes(searchLower) ||
      school.provinceName.toLowerCase().includes(searchLower) ||
      school.cityName.toLowerCase().includes(searchLower) ||
      school.belong.toLowerCase().includes(searchLower)
    );
  });

  const renderContent = () => {
    if (selectedSchool) {
      let schoolHistoryIntro = '正在收集...';

      if (
        schoolDetailInfo &&
        schoolDetailInfo.schoolDetail &&
        schoolDetailInfo.schoolDetail.historyIntro
      ) {
        for (const [key, value] of Object.entries(
          JSON.parse(schoolDetailInfo.schoolDetail.historyIntro)
        )) {
          schoolHistoryIntro = value;
        }
      }

      return (
        <div className="p-4">
          <div className="mb-6">
            <img
              src="https://ai-public.mastergo.com/ai/img_res/ba9ddbcae7fb4ea04386e5a1ddfee657.jpg"
              alt="校园风光"
              className="w-full h-48 object-cover rounded-lg shadow-md mb-4"
            />
            <div className="gap-2 ">
              {schoolDetailInfo &&
                schoolDetailInfo.features &&
                schoolDetailInfo.features.split(',').map((tag, index) => (
                  <Tag key={index} color="green" className="mb-2">
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
                    <p className="text-gray-700">{schoolHistoryIntro}</p>
                  </div>
                ),
              },
              {
                key: 'advantages',
                label: '国家级特色专业',
                children: (
                  <div className="grid grid-cols-2 gap-4">
                    {schoolDetailInfo &&
                      schoolDetailInfo.majors.map((adv, index) => {
                        if (adv.isNationalFeature) {
                          return (
                            <Card key={'adv' + index} className="shadow-sm">
                              <h4 className="font-medium">{adv.name}</h4>
                              <Tag color="green">{adv.eduLevel === 'ben' ? '本科' : '专科'}</Tag>
                              <Tag color="green">{adv.studyPeriod}</Tag>
                            </Card>
                          );
                        }
                      })}
                  </div>
                ),
              },
              {
                key: 'labs',
                label: '省级特色专业',
                children: (
                  <div className="grid grid-cols-2 gap-4">
                    {schoolDetailInfo &&
                      schoolDetailInfo.majors.map((adv, index) => {
                        if (adv.isProvinceFeature) {
                          return (
                            <Card key={'adv' + index} className="shadow-sm">
                              <h4 className="font-medium">{adv.name}</h4>
                              <Tag color="green">{adv.eduLevel === 'ben' ? '本科' : '专科'}</Tag>
                              <Tag color="green">{adv.studyPeriod}</Tag>
                            </Card>
                          );
                        }
                      })}
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
                  className="text-xm"
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
              {/* <h3 className="text-lg font-medium mb-4">就业方向</h3> */}
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: getMajorBriefHtml(majorBrief?.careerDevelopment, '就业方向正在搜集中...'),
                }}
              ></div>
            </div>
          </div>
        );
      case 'schools': {
        return (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索院校..."
                  className="w-full h-10 pl-10 pr-4 text-sm border-none rounded-lg bg-white shadow-sm focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
            {schoolLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredSchools?.length > 0 ? (
                  filteredSchools.map((school) => (
                    <Card
                      key={school.code}
                      className="cursor-pointer hover:shadow-lg transition-shadow border-none"
                      onClick={() => {
                        getSchools(school.code);
                        setSelectedSchool(school.code);
                      }}
                      hoverable
                    >
                      <h3 className="font-medium mb-2">{school.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {school.provinceName}-{school.cityName}
                      </p>
                      <div className="mt-2">
                        <Tag className="mr-2 mb-2" color="green">
                          {school.nature === 'public'
                            ? '公办'
                            : school.nature === 'private'
                              ? '民办'
                              : '独立学院'}
                        </Tag>
                        <Tag className="mr-2 mb-2" color="blue">
                          {school.belong}
                        </Tag>
                        <Tag className="mr-2 mb-2" color="yellow">
                          {school.level === 'ben' ? '本科' : '专科'}
                        </Tag>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">未找到匹配的院校</div>
                )}
              </div>
            )}
          </div>
        );
      }
      case 'courses':
        return (
          <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h2 className="text-xl font-medium mb-4">本专业主修课程</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: getMajorBriefHtml(majorBrief?.studyContent, '专业主修课程正在搜集中...'),
                }}
              ></p>
            </div>
          </div>
        );
      case 'shares':
        return (
          <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h2 className="text-xl font-medium mb-4">学长分享</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: getMajorBriefHtml(majorBrief?.seniorTalk, '学长分享正在搜集中...'),
                }}
              ></p>
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
              onClick={() => {
                setSelectedSchool(null);
                setActiveSection('intro');
              }}
            >
              <i className={`fas fa-file-alt text-base ${!sidebarCollapsed ? 'mr-3' : ''}`}></i>
              {!sidebarCollapsed && <span className="text-xm">专业介绍</span>}
            </button>
            <button
              className={`px-4 h-12 flex items-center justify-center ${
                activeSection === 'courses' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedSchool(null);
                setActiveSection('courses');
              }}
            >
              <i className={`fas fa-book text-base ${!sidebarCollapsed ? 'mr-3' : ''}`}></i>
              {!sidebarCollapsed && <span className="text-xm">主修课程</span>}
            </button>
            <button
              className={`px-4 h-12 flex items-center justify-center ${
                activeSection === 'schools' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedSchool(null);
                setActiveSection('schools');
              }}
            >
              <i className={`fas fa-school text-base ${!sidebarCollapsed ? 'mr-3' : ''}`}></i>
              {!sidebarCollapsed && <span className="text-xm">招生院校</span>}
            </button>
            <button
              className={`px-4 h-12 flex items-center justify-center ${
                activeSection === 'shares' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedSchool(null);
                setActiveSection('shares');
              }}
            >
              <i className={`fas fa-users text-base ${!sidebarCollapsed ? 'mr-3' : ''}`}></i>
              {!sidebarCollapsed && <span className="text-xm">学长分享</span>}
            </button>
          </div>
        </div>
        <div
          className={`flex-1 ${sidebarCollapsed ? 'ml-14' : 'ml-[120px]'} ${sidebarCollapsed ? 'max-w-[calc(100vw-56px)]' : 'max-w-[calc(100vw-120px)]'} transition-all duration-300`}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
export default App;
