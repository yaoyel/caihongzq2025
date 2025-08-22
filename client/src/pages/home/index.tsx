import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from 'antd-mobile';
import { StarOutline, FileOutline, ClockCircleOutline, AddSquareOutline } from 'antd-mobile-icons';
import logo from '../../../public/icons/logo.jpg';

const DefaultPage: React.FC = () => {
  const navigate = useNavigate();

  // 处理院校查询按钮点击
  const handleCollegeSearch = () => {
    // 跳转到院校查询页面
    navigate('/basicInfo');
  };

  // 处理自评按钮点击
  const handleSelfAssessment = () => {
    // 跳转到自评页面
    navigate('/basicInfo');
  };

  return (
    <div className="h-screen bg-white flex flex-col items-center px-4 py-6 overflow-y-auto">
      {/* 页面标题栏 */}
      <div className="w-full max-w-md mb-6 lg:mb-8">
        <div className="flex items-center mb-3 lg:mb-4">
          {/* Logo图标 */}
          <div className="w-10 h-10 lg:w-12 lg:h-12 mr-3 lg:mr-4 flex-shrink-0">
            <img 
              src={logo} 
              alt="逆袭智选志愿" 
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          
          {/* 标题文字 */}
          <div className="flex-1">
            <h1 className="text-lg lg:text-xl font-bold text-blue-600 mb-0.5 lg:mb-1">
              逆袭智选志愿
            </h1>
            <p className="text-xs lg:text-sm text-gray-600">
              你的分数，不止一个选择
            </p>
          </div>
        </div>
        
        {/* 分隔线 */}
        <div className="w-full h-px bg-gray-200"></div>
      </div>

      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        {/* 院校查询卡片 */}
        <Card className="w-full mb-3 lg:mb-4 bg-white rounded-lg shadow-sm">
          <div className="p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-black mb-1.5 lg:mb-2">
              让现实支撑理想
            </h2>
            <p className="text-base lg:text-lg text-gray-700 mb-3 lg:mb-4">
              录入高考分(或模考分),一键查看所有可选院校
            </p>
            <Button
              className="w-full h-12 lg:h-14 bg-blue-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              onClick={handleCollegeSearch}
            >
              <div className="flex items-center justify-center whitespace-nowrap">
                <StarOutline className="mr-2 text-white flex-shrink-0" />
                <span className="text-base lg:text-base font-bold">一键查看可选院校</span>
              </div>
            </Button>
          </div>
        </Card>

        {/* 自评功能卡片 */}
        <Card className="w-full bg-white rounded-lg shadow-sm">
          <div className="p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-black mb-1.5 lg:mb-2">
              让理想照进现实
            </h2>
            <p className="text-base lg:text-lg text-gray-700 mb-1.5 lg:mb-2">
              完成多维度自评,助您找到喜欢且擅长的专业!
            </p>
            <p className="text-base lg:text-lg text-gray-700 mb-3 lg:mb-4">
              以高考为起点,培育&ldquo;热爱的种子&rdquo;,逆袭未来!
            </p>
            
            {/* 注意事项列表 */}
            <div className="mb-3 lg:mb-4 space-y-1.5 lg:space-y-2">
              <div className="flex items-start">
                <ClockCircleOutline className="text-orange-500 mt-1 lg:mt-1.5 mr-2 flex-shrink-0" />
                <span className="text-sm lg:text-lg text-gray-600">
                  1. 问卷涉及多维度、168道题,请务必预留45分钟左右整段安静时间。
                </span>
              </div>
              <div className="flex items-start">
                <AddSquareOutline className="text-orange-500 mt-1 lg:mt-1.5 mr-2 flex-shrink-0" />
                <span className="text-sm lg:text-lg text-gray-600">
                  2. 根据&ldquo;第一感觉&rdquo;,选择&ldquo;最像自己&rdquo;的选项即可,无需过多考虑。
                </span>
              </div>
              <div className="flex items-start">
                <AddSquareOutline className="text-orange-500 mt-1 lg:mt-1.5 mr-2 flex-shrink-0" />
                <span className="text-sm lg:text-lg text-gray-600">
                  3. 本问卷仅限学生本人作答!
                </span>
              </div>
            </div>

            <Button
              className="w-full h-12 lg:h-14 bg-orange-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              onClick={handleSelfAssessment}
            >
              <div className="flex items-center justify-center whitespace-nowrap">
                <FileOutline className="mr-2 text-white flex-shrink-0" />
                <span className="text-base lg:text-base font-bold">开启自评</span>
              </div>
            </Button>
          </div>
        </Card>
      </div>

      {/* 底部标语 */}
      <Card className="w-full max-w-md mt-6 lg:mt-8 bg-white rounded-lg shadow-sm">
        <div className="p-4 lg:p-6 text-center">
          <div className="w-12 lg:w-16 h-px bg-gray-300 mx-auto mb-2 lg:mb-3"></div>
          <p className="text-xs lg:text-sm text-gray-600">
            智能推荐 · 精准定位 · 全程规划
          </p>
        </div>
      </Card>
    </div>
  );
};

export default DefaultPage;
