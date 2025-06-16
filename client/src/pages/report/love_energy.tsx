// @ts-nocheck
import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
const App: React.FC = () => {
    const navigate = useNavigate();
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'learnHappy' | 'learnWell'>('learnHappy');
  const handleModalOpen = (modalId: string) => {
    setSelectedModal(modalId);
  };
  const handleModalClose = () => {
    setSelectedModal(null);
  };
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 left-0 right-0 h-14 bg-white shadow-md z-50 flex items-center px-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          className="mr-2"
          onClick={() => navigate(-1)}
        />
        {/* <i className="fas fa-arrow-left text-xl text-gray-600 cursor-pointer mr-4" ></i> */}
        <div className="text-lg font-medium">乐学&善学特质</div>
      </nav>
      {/* 分数展示 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 mt-14">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-medium">002 逻辑学</span>
          <div className="flex items-center">
            <span className="text-green-600 font-bold text-xl">热爱能量 98分！</span>
          </div>
        </div>
      </div>
      {/* 内容切换导航条 */}
      <div className="bg-white shadow-sm z-40">
        <div className="grid grid-cols-2 w-full h-12">
          <div
            className={`flex flex-col items-center justify-center cursor-pointer border-r border-gray-200 ${activeTab === 'learnHappy' ? 'text-green-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('learnHappy')}
          >
            <span className="text-base font-medium">乐学特质</span>
          </div>
          <div
            className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'learnWell' ? 'text-green-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('learnWell')}
          >
            <span className="text-base font-medium">善学特质</span>
          </div>
        </div>
      </div>
      {/* 主要内容区域 */}
      <div className="pt-2 px-4 pb-6">
        {/* 乐学特质部分 */}
        <div
          className={`bg-white rounded-lg shadow-sm p-6 mb-6 ${activeTab === 'learnHappy' ? 'block' : 'hidden'}`}
        >
          <h2 className="text-xl font-bold mb-6 text-gray-800">乐学特质：</h2>
          {/* 特质项目1 */}
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                1.喜欢～5.想～5.2.创意思考～5.2.2.不需要达到的
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-green-600">我的自评：A</span>
                <Button
                  type="link"
                  className="flex items-center text-green-600"
                  onClick={() => handleModalOpen('modal1')}
                >
                  <QuestionCircleOutlined className="mr-1" />
                  查看问卷内容
                </Button>
              </div>
            </div>
            <div className="pl-4 text-gray-600 leading-relaxed">
              <p className="mb-2">
                • 经常为某种发现不停惊喜（如研究自然进化规律、探索文明演变趋势）
              </p>
              <p className="mb-2">
                • "想"时总希望有更多新发现（如：深入思考复杂问题时，因认识规律而欣喜）
              </p>
              <p className="mb-2">• 就算没目标，也喜欢各种"发现"……"（纯粹为兴趣演练各种推演）</p>
            </div>
          </div>
          {/* 特质项目2 */}
          <div className="mb-8">
            <div className="flex flex-col mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                2.喜欢～6.做～6.1.能独立完成的～6.1.1.偏思维运算类
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-green-600">我的自评：A</span>
                <Button
                  type="link"
                  className="flex items-center text-green-600"
                  onClick={() => handleModalOpen('modal2')}
                >
                  <QuestionCircleOutlined className="mr-1" />
                  查看问卷内容
                </Button>
              </div>
            </div>
            <div className="pl-4 text-gray-600 leading-relaxed">
              <p className="mb-2">• 经常为验证方法的"正确性"、想法的"可行性"而投入</p>
              <p className="mb-2">• "做"时很专注/很用心（如：基于某例落地验证理论/方法时）</p>
              <p className="mb-2">• 喜欢手脑结合，验证方法正确、细法可行</p>
            </div>
          </div>
          {/* 特质项目3 */}
          <div className="mb-8">
            <div className="flex flex-col mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                3.喜欢～4.记～4.2.主动记忆～4.2.1.理解时
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-green-600">我的自评：A</span>
                <Button
                  type="link"
                  className="flex items-center text-green-600"
                  onClick={() => handleModalOpen('modal3')}
                >
                  <QuestionCircleOutlined className="mr-1" />
                  查看问卷内容
                </Button>
              </div>
            </div>
            <div className="pl-4 text-gray-600 leading-relaxed">
              <p className="mb-2">• 经常在理解后乐于记住（如备考知识点、演讲台词）</p>
              <p className="mb-2">• 记忆理解的内容时总觉得很有价值</p>
              <p className="mb-2">• 需要记忆的内容，只要理解，就能花时间去记忆</p>
            </div>
          </div>
        </div>
        {/* 善学特质部分 */}
        <div
          className={`bg-white rounded-lg shadow-sm p-6 ${activeTab === 'learnWell' ? 'block' : 'hidden'}`}
        >
          <h2 className="text-xl font-bold mb-6 text-gray-800">善学特质：</h2>
          {/* 特质项目1 */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">
                1.天赋～2.听～2.2.能听出不同的点～2.2.1.需理解内容
              </h3>
              <Button
                type="link"
                className="flex items-center text-green-600"
                onClick={() => handleModalOpen('modal4')}
              >
                <QuestionCircleOutlined className="mr-1" />
                查看问卷内容
              </Button>
            </div>
            <div className="pl-4 text-gray-600 leading-relaxed">
              <p className="mb-2">• 理解内容后，能迅速听出和自己认知不一致的点</p>
              <p className="mb-2">• 听出不一致的点时，往往会追问"是什么导致差异"</p>
              <p className="mb-2">• 善于质疑与反思（记忆中的闪光点）</p>
            </div>
          </div>
        </div>
      </div>
      {/* 模态框 */}
      <Modal
        title="问卷内容"
        open={selectedModal !== null}
        onCancel={handleModalClose}
        footer={null}
        className="max-w-lg"
      >
        <div className="p-4">
          <p className="text-gray-700">
            {selectedModal === 'modal1' && '这里是问卷1的详细内容...'}
            {selectedModal === 'modal2' && '这里是问卷2的详细内容...'}
            {selectedModal === 'modal3' && '这里是问卷3的详细内容...'}
            {selectedModal === 'modal4' && '这里是问卷4的详细内容...'}
          </p>
        </div>
      </Modal>
    </div>
  );
};
export default App;
