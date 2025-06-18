// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Modal, Tag } from 'antd';
import * as echarts from 'echarts';
import { DownOutline, LeftOutline } from 'antd-mobile-icons';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getUserMajorScores, getMajorDetail } from '../../config';
import { SpinLoading } from 'antd-mobile';

const App: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expanded, setExpanded] = useState([0]);
  const [expandedNoLove, setExpandedNoLove] = useState([0]);
  const [majorLove, setmajorLove] = useState([]);
  const [majoNoLove, setmajorNoLove] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [majorDetails, setMajorDetail] = useState([]);
  
  const getMajorDetailInfo = async (majorCode) => {
    try {
      if (!majorCode) {
        console.error('未找到专业代码');
        return;
      }
      if (majorDetails.some((item) => item.code === majorCode)) {
        return;
      }
      const detailResponse = await getMajorDetail(majorCode);
      if (detailResponse && detailResponse.code === 200 && detailResponse.data) {
        setMajorDetail(prev => [...prev, detailResponse.data]);
      }
    } catch (error) {
      console.error('获取专业详细信息失败:', error);
    }
  };

  useEffect(() => {
    const fetchMajorScores = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          message.error('请先登录');
          navigate('/login');
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user?.id ?? user?.data?.id;
        const response = await getUserMajorScores(userId);
        if (response && response.code === 200) {
          // 获取所有分数数据
          const scores = (response.data && response.data.scores) || [];

          // 获取前3条最高分数据
          const topScores = scores.slice(0, 3);
          setmajorLove(topScores);

          // 获取后3条最低分数据并倒序
          const bottomScores = scores.slice(-3).reverse();
          setmajorNoLove(bottomScores);

          // 获取专业详情
          if (topScores && bottomScores) {
            getMajorDetailInfo(topScores[0].majorCode);
            getMajorDetailInfo(bottomScores[0].majorCode);
          }
        } else {
          message.error(response.message || '修改昵称失败');
        }
      } catch (error) {
        console.error('获取专业分数失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMajorScores();
  }, []);

  const handleExpand = (index: number) => {
    setExpanded((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleExpandNoLove = (index: number) => {
    setExpandedNoLove((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const renderMajorDetail = (code: string) => {
    const majorDetail = majorDetails.find((item) => item.code === code);
    if (majorDetail) {
      const careerDevelopmentT = majorDetail.careerDevelopment.replace(/'/g, '"');
      const careerDevelopmentTemp = JSON.parse(careerDevelopmentT);
      const schools =
        majorDetail.schools && majorDetail.schools.length > 10
          ? majorDetail.schools.slice(0, 10)
          : majorDetail.schools;
      return (
        <div className="space-y-3">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm font-medium text-green-700 mb-1">专业简介</div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {majorDetail.majorBrief ?? '正在收集...'}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-700 mb-1">就业方向</div>
            <p className="text-xs text-gray-600">
              {careerDevelopmentTemp['主要就业方向'] ?? '正在收集...'}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm font-medium text-purple-700 mb-1">招生院校</div>
            <p className="text-xs text-gray-600">
              {schools && schools.length > 0
                ? schools.map((i, index) => (
                    <>
                      <Tag color="green" className="mb-1">
                        {i.name}
                      </Tag>
                      {index === schools.length - 1 ? '......' : ''}
                    </>
                  ))
                : '正在收集...'}
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm font-medium text-green-700 mb-1">专业简介</div>
            <p className="text-xs text-gray-600 leading-relaxed">正在收集...</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-700 mb-1">就业前景</div>
            <p className="text-xs text-gray-600">正在收集...</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm font-medium text-purple-700 mb-1">招生院校</div>
            <p className="text-xs text-gray-600">正在收集...</p>
          </div>
        </div>
      );
    }
  };
  return (
    <div className="relative min-h-screen bg-[#FFFDF7] pb-16">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-white shadow-sm z-50 flex items-center">
        <div className="absolute left-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mr-2"
          />
        </div>
        <h1 className="text-lg font-medium flex-1 text-center">各专业分析报告</h1>
      </div>
      {/* 主要内容区域 */}
      <div className="pt-16 px-4">
        {/* 温馨提示 */}
        <div className="rounded-lg p-4 mb-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
          <p className="text-gray-600 text-sm leading-relaxed">
            温馨提示：以下分析，均基于您对自身喜欢与天赋自评，受自我认知深入程度影响，请结合实际情况综合考量。
          </p>
        </div>
        {/* "最爱"专业部分 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-green-500 text-xl font-medium">"最爱"</span>
            <span className="text-gray-700 text-xl ml-1">专业</span>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <SpinLoading color="primary" />
              </div>
            ) : (
              majorLove.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                >
                  <div className="flex flex-col">
                    <div
                      className="flex justify-between items-center mb-3 cursor-pointer"
                      onClick={() => {
                        getMajorDetailInfo(item.majorCode);
                        handleExpand(index);
                      }}
                    >
                      <div
                        className="flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/professColleges?majorCode=${item.majorCode}&&majorName=${item.majorName}&score=${item.score}&isLove=true`
                          );
                        }}
                      >
                        <span className="text-gray-500">{item.majorCode}</span>
                        <span className="ml-1 text-gray-800 cursor-pointer hover:text-gray-600 underline">
                          {item.majorName}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="text-green-500 font-medium mr-2 cursor-pointer hover:text-green-600 underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/loveEnergy?majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&isLove=true`
                            );
                          }}
                        >
                          热爱能量 {Math.ceil(item.score * 100)} 分！
                        </div>
                        <DownOutline
                          className={`transition-transform ${expanded.includes(index) ? 'rotate-180' : ''}`}
                          style={{ fontSize: 18 }}
                        />
                      </div>
                    </div>
                    {expanded.includes(index) && renderMajorDetail(item.majorCode)}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 relative">
            <button
              onClick={showModal}
              className="text-blue-500 text-sm flex items-center group hover:text-blue-600 transition-colors"
            >
              查看更多
              <i className="fas fa-arrow-right ml-1 transform transition-transform group-hover:translate-x-1"></i>
            </button>
          </div>
        </div>
        {/* "难爱"专业部分 */}
        <div>
          <div className="flex items-center mb-4">
            <span className="text-red-500 text-xl font-medium">"难爱"</span>
            <span className="text-gray-700 text-xl ml-1">专业</span>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <SpinLoading color="primary" />
              </div>
            ) : (
              majoNoLove.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                >
                  <div className="flex flex-col">
                    <div
                      className="flex justify-between items-center mb-3 cursor-pointer"
                      onClick={() => {
                        getMajorDetailInfo(item.majorCode);
                        handleExpandNoLove(index);
                      }}
                    >
                      <div
                        className="flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/professColleges?majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&isLove=false`
                          );
                        }}
                      >
                        <span className="text-gray-500">{item.majorCode}</span>
                        <span className="ml-1 text-gray-800 cursor-pointer hover:text-gray-600 underline">
                          {item.majorName}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="text-red-500 font-medium mr-2 cursor-pointer hover:text-green-600 underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/loveEnergy?majorCode=${item.majorCode}&majorName=${item.majorName}&score=${item.score}&isLove=false`
                            );
                          }}
                        >
                          热爱能量 {Math.ceil(item.score * 100)} 分！
                        </div>
                        <DownOutline
                          className={`transition-transform ${expandedNoLove.includes(index) ? 'rotate-180' : ''}`}
                          style={{ fontSize: 18 }}
                        />
                      </div>
                    </div>
                    {expandedNoLove.includes(index) && renderMajorDetail(item.majorCode)}
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={showModal}
            className="text-blue-500 text-sm mt-4 flex items-center group hover:text-blue-600 transition-colors"
          >
            查看更多
            <i className="fas fa-arrow-right ml-1 transform transition-transform group-hover:translate-x-1"></i>
          </button>
          {/* 支付弹窗 */}
          <Modal
            title="解锁完整分析报告"
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            className="rounded-2xl"
          >
            <div className="py-6">
              <div className="text-center mb-6">
                <div className="text-2xl font-semibold text-gray-800 mb-2">亲友特惠</div>
                <div className="text-4xl font-bold text-red-500 mb-2">¥88</div>
                <div className="text-gray-500 text-sm mb-4">原价 ¥298</div>
                <div className="text-sm text-gray-600 mb-4">解锁全部 845 个本科专业热爱能量值</div>
              </div>
              <Button
                type="primary"
                className="w-full h-12 !rounded-button text-lg font-medium bg-gradient-to-r from-green-500 to-green-400 border-none hover:opacity-90"
                onClick={handleCancel}
              >
                立即支付
              </Button>
            </div>
          </Modal>
        </div>
        {/* 底部说明文字 */}
        <div className="mt-8 text-sm text-gray-500 leading-relaxed">
          <p>
            每个专业名称后的"热爱能量"，均可点击进入，查看该专业"乐学/善学特质"，了解专业特质匹配原因。
          </p>
          <p>并可点击进入自评内容，查看选项与得分。</p>
          <p>详细了解，为什么这个专业我有这样的"热爱能量"！</p>
        </div>
      </div>
    </div>
  );
};
export default App;
