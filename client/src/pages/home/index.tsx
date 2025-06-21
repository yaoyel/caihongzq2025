// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Button, Modal } from 'antd';
import { TextOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { Dialog } from 'antd-mobile';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleWechatAuth = () => {
    const authUrl =
      'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe85481f908a50ffc&redirect_uri=http://www.caihongzq.com/default/&response_type=code&scope=snsapi_userinfo&state=STATE&connect_redirect=1#wechat_redirect';
    window.location.href = authUrl;
  };

  const handleAuthCancel = () => {
    setIsAuthModalVisible(false);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('new-user');
    if (!userStr) {
      setIsAuthModalVisible(true);
      setLoading(false);
      return;
    }
    setLoading(false);
  }, []);

  return (
    <div
      className="relative min-h-[762px] bg-white text-gray-800 pb-1 flex flex-col justify-top items-center"
      style={{ height: '100vh', minHeight: '100vh' }}
    >
      {/* 顶部导航栏 */}
      <div className=" top-0 w-full bg-white shadow-md z-50 px-5 py-4 flex justify-between items-center">
        <span className="text-xl font-semibold text-green-700">发现热爱</span>
        {/* <i className="fas fa-bell text-gray-600 text-lg"></i> */}
      </div>

      {/* 主要内容区域 */}
      <div className=" px-5 space-y-6 mt-6">
        {/* 重要提示 */}
        {/* <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg shadow-sm">
          <p className="text-red-700 font-bold text-center text-lg">本问卷仅限考生本人作答！</p>
        </div> */}

        {/* 顶部标语区域 */}
        {/* <div className="relative">
          <div className="border-2 border-green-400 border-dashed rounded-xl p-5 flex justify-between items-center bg-green-50">
            <span className="text-lg font-medium text-green-700">发现热爱，奔赴未来！</span>

          </div>
        </div> */}

        {/* 倒计时信息区域 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm pt-10">
          <p className="mb-3 text-base leading-relaxed">本问卷会引导您看见自己内心的喜欢与天赋。</p>
          <p className="mb-3 text-base leading-relaxed">
            不论高考成绩如何，它都会助您培育"热爱的种子"，找到喜欢且擅长的专业。
          </p>
          <p className="text-base leading-relaxed">
            <span className="text-green-600 font-semibold">"逆袭"</span>
            未来之路，需要内心的热爱，愿您以高考为起点，
            <span className="text-green-600 font-semibold">越来越自由自在的心想事成！</span>
          </p>
        </div>

        {/* 操作指引 */}
        <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-lg font-medium mb-4">
            接下来需要您<span className="text-green-600 font-bold">准备</span>：
          </p>
          <div className="space-y-4">
            <p className="text-base leading-relaxed">
              1. 预留安静的时间空间：问卷会涉及 168 道题目，请您务必选择 45
              分钟左右整段安静的时间来做答。
            </p>
            <p className="text-base leading-relaxed">
              2. 凭<span className="text-green-600 font-bold">第一感觉</span>
              作答：选择时，无需过多考虑，根据直觉或回顾选择
              <span className="text-green-600 font-bold">"最像自己"</span>的选项即可。
            </p>
            <p className="text-red-700 font-bold  text-lg">本问卷仅限考生本人作答！</p>
          </div>
        </div>

        {/* 功能按钮区域 */}
        <div className="space-y-4 mt-8">
          <div className="relative">
            <button
              onClick={() => navigate('/assessment/scale168')}
              className="!rounded-button w-full bg-green-500 text-white py-4 px-6 rounded-xl text-lg font-medium shadow-lg hover:bg-green-600 transition-colors duration-300 flex items-center justify-center"
            >
              <TextOutline className="discover-btn-lock" />
              &nbsp; 开启自评问卷
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/analysisReport')}
              className="!rounded-button w-full bg-green-100 text-green-800 py-4 px-6 rounded-xl text-base font-medium shadow-sm hover:bg-green-200 transition-colors duration-300"
            >
              <span className="font-bold">专业</span>解析
            </button>
            <button
              onClick={() =>
                Dialog.alert({
                  content: `'爱的礼物'！`,
                  onConfirm: () => {
                    console.log('Confirmed');
                  },
                })
              }
              className="!rounded-button w-full bg-green-100 text-green-800 py-4 px-6 rounded-xl text-base font-medium shadow-sm hover:bg-green-200 transition-colors duration-300"
            >
              趣味发现
            </button>
          </div>
        </div>
      </div>

      {/* 微信授权弹窗 */}
      <Modal
        title="微信授权登录"
        open={isAuthModalVisible}
        onCancel={handleAuthCancel}
        footer={null}
        className="rounded-2xl"
        closable={false}
      >
        <div className="py-6">
          <div className="text-center mb-6">
            <div className="text-2xl font-semibold text-gray-800 mb-2">需要授权登录</div>
            <div className="text-gray-500 text-sm mb-4">请使用微信授权登录以使用完整功能</div>
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                授权后将获得您的微信头像、昵称等基本信息，用于个性化推荐服务
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Button
              type="primary"
              className="w-full h-12 !rounded-button text-lg font-medium bg-gradient-to-r from-green-500 to-green-400 border-none hover:opacity-90"
              onClick={handleWechatAuth}
            >
              微信授权登录
            </Button>
            <Button
              className="w-full h-10 !rounded-button text-gray-600 border-gray-300 hover:border-gray-400"
              onClick={handleAuthCancel}
            >
              稍后再说
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
