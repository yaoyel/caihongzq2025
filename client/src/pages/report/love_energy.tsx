// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SpinLoading, Card, Radio, Modal as MobileModal, Space } from 'antd-mobile';
import {
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { getMajorDetail, getScalesByElementsWithAnswers } from '../../config';
import { color } from 'echarts';
const App: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [modalSelects, setModalSelects] = useState([]);
  const [activeTab, setActiveTab] = useState<'learnHappy' | 'learnWell'>('learnHappy');
  const [elementList, setElementList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 添加自定义样式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .adm-radio-content {
        font-size: 12px !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 添加页面加载时滚动到顶部的效果
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const majorCode = searchParams.get('majorCode');
  const score = searchParams.get('score');
  const isLove = searchParams.get('isLove');
  const majorName = searchParams.get('majorName');
  const [majorDetail, setMajorDetail] = useState(null);
  const getMyScore = (elementId: string) => {
    let myScores = '';
    elementList.map((s: any, index: number) => {
      if (s.elementId === elementId) {
        myScores += s.score + '/';
      }
    });
    return myScores.slice(0, -1);
  };

  const scoreToBigletters = (score: number) => {
    switch (score) {
      case 2:
        return 'A';
      case 1:
        return 'B';
      case 0:
        return 'C';
      case -1:
        return 'D';
      case -2:
        return 'E';
    }
  };
  const handleModalOpen = (modalId: string, elementId: string) => {
    const newModalSelects = [];
    elementList &&
      elementList.map((item: any) => {
        if (item.elementId === elementId) {
          newModalSelects.push({
            name: item.content,
            options: item.options,
            score: item.score,
          });
        }
      });
    setModalSelects(newModalSelects);
    setSelectedModal(modalId);
  };
  const handleModalClose = () => {
    setSelectedModal(null);
  };
  useEffect(() => {
    const fetchMajorInfo = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        if (!majorCode || !score) {
          console.error('未找到专业代码');
          return;
        }

        const response = await getMajorDetail(majorCode);

        if (response && response.code === 200) {
          console.log(response.data);
          //获取维度id
          let ids = '';
          response.data.majorElementAnalyses.map((item: any) => {
            ids += item.element.id + ',';
          });
          if (ids) {
            //获取维度及问卷和答案
            const user = JSON.parse(userStr);
            const scaleResponse = await getScalesByElementsWithAnswers(ids, user.data.id);
            if (scaleResponse && scaleResponse.code === 200) {
              let list = [];
              scaleResponse.data.map((item: any) => {
                if (item.options && item.options.length > 0) {
                  list.push({
                    content: item.content,
                    elementId: item.elementId,
                    score: item.answers && scoreToBigletters(item.answers[0].score),
                    options: item.options,
                  });
                }
              });
              if (list.length > 0) {
                setElementList(list);
                console.log('elementList');
                console.log(list);
              }
            }
          }
          setMajorDetail(response.data);
        }
      } catch (error) {
        console.error('获取乐学善学信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMajorInfo();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinLoading color="primary" />
      </div>
    );
  }

  let lexueIndex = 0;
  let shanxueIndex = 0;

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
      <div className="bg-white rounded-lg shadow-sm p-4  mt-14">
        <div className="flex items-center justify-between mb-2">
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
      <div
        style={{
          fontSize: '12px',
          color: '#6B7280',
          border: '1px dashed #34D399',
          borderRadius: '6px',
          padding: '8px 12px',
          margin: '10px 10px',
          background: '#F9FAFB',
          display: 'block',
        }}
      >
        专业热爱能量值=该专业"乐学/善学特质"得分/总分*100
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
          {/* <h2 className="text-xl font-bold mb-6 text-gray-800">乐学特质：</h2> */}
          {/* 特质项目1 */}
          {majorDetail &&
            majorDetail.majorElementAnalyses?.map((item, index) => {
              if (item.type === 'lexue') {
                lexueIndex = lexueIndex + 1;
                return (
                  <div className="mb-8">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        {lexueIndex}.{item.element.type === 'talent' ? '天赋' : '喜欢'}-
                        {item.element.dimension}～{item.element.name} （{item.element.status}）
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">
                          我的自评：{getMyScore(item.element.id)}
                        </span>
                        <Button
                          type="link"
                          className="flex items-center text-green-600"
                          onClick={() => handleModalOpen('modal1', item.element.id)}
                        >
                          <QuestionCircleOutlined className="mr-1" />
                          查看问卷内容
                        </Button>
                      </div>
                    </div>
                    <div className="text-l font-bold mb-1 text-gray-800">特质描述：</div>
                    <div className="pl-4 text-gray-600 leading-relaxed">
                      <p className="mb-2">• {item.summary}</p>
                      <p className="mb-2">• {item.theoryBasis}</p>
                    </div>

                    <div className="text-l font-bold mb-1 text-gray-800">匹配原因：</div>
                    <div className="pl-4 text-gray-600 leading-relaxed">
                      <p className="mb-2">{item.matchReason}</p>
                    </div>
                  </div>
                );
              }
            })}
        </div>
        {/* 善学特质部分 */}
        <div
          className={`bg-white rounded-lg shadow-sm p-6 ${activeTab === 'learnWell' ? 'block' : 'hidden'}`}
        >
          {/* <h2 className="text-xl font-bold mb-6 text-gray-800">善学特质：</h2> */}
          {/* 特质项目1 */}
          {majorDetail &&
            majorDetail.majorElementAnalyses?.map((item, index) => {
              if (item.type === 'shanxue') {
                shanxueIndex = shanxueIndex + 1;
                return (
                  <div className="mb-8">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        {shanxueIndex}.{item.element.type === 'talent' ? '天赋' : '喜欢'}-
                        {item.element.dimension}～{item.element.name} （{item.element.status}）
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">
                          我的自评：{getMyScore(item.element.id)}
                        </span>
                        <Button
                          type="link"
                          className="flex items-center text-green-600"
                          onClick={() => handleModalOpen('modal1', item.element.id)}
                        >
                          <QuestionCircleOutlined className="mr-1" />
                          查看问卷内容
                        </Button>
                      </div>
                    </div>
                    <div className="text-l font-bold mb-1 text-gray-800">特质描述：</div>
                    <div className="pl-4 text-gray-600 leading-relaxed">
                      <p className="mb-2">• {item.summary}</p>
                      <p className="mb-2">• {item.theoryBasis}</p>
                    </div>

                    <div className="text-l font-bold mb-1 text-gray-800">匹配原因：</div>
                    <div className="pl-4 text-gray-600 leading-relaxed">
                      <p className="mb-2">{item.matchReason}</p>
                    </div>
                  </div>
                );
              }
            })}
        </div>

        <div
          style={{
            fontSize: '12px',
            color: '#6B7280',
            border: '1px dashed #34D399',
            borderRadius: '6px',
            padding: '8px 12px',
            margin: '10px 10px',
            background: '#F9FAFB',
            display: 'block',
          }}
        >
          <b>温馨提醒：</b>
          <span style={{ color: '#1677ff' }}>
            此处仅列出该专业最重要几项乐学/善学特质，不意味着其他特质对学好该专业不重要
          </span>
          ，且"热爱能量"分值源于您对自身喜欢与天赋自评，受自我认知深入程度影响，请结合实际情况综合考量。
        </div>
      </div>
      {/* 模态框 */}
      <MobileModal
        visible={selectedModal !== null}
        className="custom-modal-width"
        style={undefined}
        title="问卷内容及您的自评"
        content={
          <div className="p-4 text-gray-600 " style={{ display: 'flex', flexDirection: 'column' }}>
            {modalSelects &&
              modalSelects.length > 0 &&
              modalSelects.map((item: any, index: number) => (
                <React.Fragment key={index}>
                  <div className="text-sm mb-4">
                    {index + 1}.{item.name}
                  </div>
                  <Radio.Group value={item.score}>
                    {item.options &&
                      item.options.map((option: any, idx: number) => (
                        <Space direction="vertical">
                          <Radio
                            key={idx}
                            value={scoreToBigletters(option.optionValue)}
                            className="text-sm mb-2"
                          >
                            {option.optionName}
                            {option.additionalInfo ? '（' + option.additionalInfo + '）' : ''}
                          </Radio>
                        </Space>
                      ))}
                  </Radio.Group>
                </React.Fragment>
              ))}
          </div>
        }
        closeOnAction
        onClose={handleModalClose}
        actions={[
          {
            key: 'close',
            text: '关闭',
          },
        ]}
      />
    </div>
  );
};
export default App;
