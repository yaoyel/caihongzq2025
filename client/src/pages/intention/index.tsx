import React, { useEffect, useState } from 'react';
import BottomNav from '../comm/bottom';
import Top from '../comm/top';
import { useNavigate } from 'react-router-dom';
import { getMajorIntentions } from '../../config/volunteer';

const EducationalPage: React.FC = () => {
  const navigate = useNavigate();
  const [majorIntentions, setMajorIntentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // 添加加载状态

  /**
   * 获取收藏专业列表
   */
  const fetchMajorIntentions = async () => {
    try {
      setLoading(true);
      const response = await getMajorIntentions();
      if (response && response.code === 200) {
        //response.data || []
        setMajorIntentions(response.data || []);
        console.log('收藏专业列表', response.data);
      }
    } catch (error) {
      console.error('获取收藏专业列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 页面初始化逻辑
    fetchMajorIntentions();
  }, []);

  // 渲染空状态提示
  const renderEmptyState = () => (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 text-center">
      <div className="mb-4">
        <div className="text-gray-400 text-6xl mb-4">📚</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">暂无收藏专业</h3>
        <p className="text-gray-500 text-sm mb-6">
          您还没有收藏任何专业，快去专业页面选择您感兴趣的专业吧！
        </p>
      </div>
      <button
        onClick={() => navigate('/major/list')}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        去专业页面收藏
      </button>
    </div>
  );

  return (
    <div className="page-bg-hasTop text-gray-900" style={{ marginTop: 40 }}>
      <Top title="意向专业" onBack={() => window.history.back()} />
      <div className="bg-[#f7f7fa] flex flex-col justify-start items-start p-3 min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-[18px] font-bold text-gray-900">
              意向专业
              <span className="ml-2 text-gray-400 text-base font-normal">收藏专业</span>
            </div>
            <div className="text-blue-600 text-[22px] font-bold">共{majorIntentions.length}个</div>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="w-full max-w-xl bg-white rounded-2xl shadow mt-3 p-6 text-center">
            <div className="text-gray-500">加载中...</div>
          </div>
        )}

        {/* 空状态提示 */}
        {!loading && majorIntentions.length === 0 && renderEmptyState()}

        {/* 专业列表 */}
        {!loading &&
          majorIntentions.length > 0 &&
          majorIntentions.map((item) => (
            <div key={item.majorCode} className="w-full max-w-xl bg-white rounded-2xl shadow mt-3">
              <div className="flex items-center justify-between bg-[#dee9fd] rounded-t-xl p-4 px-4 py-3 mb-3">
                <div className="flex items-center">
                  <span className="text-blue-600 text-lg font-bold mr-2">{item.majorCode}</span>
                  <span className="text-blue-700 text-lg font-bold">{item.majorName}</span>
                  <span className="ml-2 text-gray-400">&gt;</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-900 font-bold mr-1">热爱能量</span>
                  <span className="text-blue-700 font-bold text-lg">
                    {Math.ceil(item.score * 100)}分！
                  </span>
                </div>
              </div>
              <div className="space-y-1 p-3">
                <div className="flex items-center justify-between text-base">
                  <div>
                    <span className="text-green-600">（-5%）</span>
                    <span className="text-gray-900"> 到 </span>
                    <span className="text-red-600">（+5%）</span>
                    <span className="text-gray-900">位次段院校</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{item.group2}所</span>
                    <a
                      className={item.group2 > 0 ? 'text-blue-600' : ''}
                      href="#"
                      onClick={() => {
                        item.group2 > 0 &&
                          navigate(
                            '/intention/intentiondetail?majorCode=' +
                              item.majorCode +
                              '&groupNum=2&majorName=' +
                              item.majorName +
                              '&score=' +
                              item.score
                          );
                      }}
                    >
                      更多
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between text-base">
                  <div>
                    <span className="text-green-600">（-15%）</span>
                    <span className="text-gray-900"> 到 </span>
                    <span className="text-green-600">（-5%）</span>
                    <span className="text-gray-900">位次段院校</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{item.group3}所</span>
                    <a
                      className={item.group3 > 0 ? 'text-blue-600' : ''}
                      href="#"
                      onClick={() => {
                        item.group3 > 0 &&
                          navigate(
                            '/intention/intentiondetail?majorCode=' +
                              item.majorCode +
                              '&groupNum=3&majorName=' +
                              item.majorName +
                              '&score=' +
                              item.score
                          );
                      }}
                    >
                      更多
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between text-base">
                  <div>
                    <span className="text-red-600">（+5%到+10%）</span>
                    <span className="text-gray-900">位次段院校</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{item.group1}所</span>
                    <a
                      className={item.group1 > 0 ? 'text-blue-600' : ''}
                      href="#"
                      onClick={() => {
                        item.group1 > 0 &&
                          navigate(
                            '/intention/intentiondetail?majorCode=' +
                              item.majorCode +
                              '&groupNum=1&majorName=' +
                              item.majorName +
                              '&score=' +
                              item.score
                          );
                      }}
                    >
                      更多
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between text-base">
                  <div>
                    <span className="text-gray-900">【其他位次段院校】</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-900 mr-2">{item.group0}所</span>
                    <a
                      className={item.group0 > 0 ? 'text-blue-600' : ''}
                      href="#"
                      onClick={() => {
                        item.group0 > 0 &&
                          navigate(
                            '/intention/intentiondetail?majorCode=' +
                              item.majorCode +
                              '&groupNum=0&majorName=' +
                              item.majorName +
                              '&score=' +
                              item.score
                          );
                      }}
                    >
                      更多
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
      {/* 底部导航 */}
      <BottomNav
        selectedIndex={2}
        onSelect={() => {
          window.location.href = '/educational';
        }}
      />
    </div>
  );
};

export default EducationalPage;
