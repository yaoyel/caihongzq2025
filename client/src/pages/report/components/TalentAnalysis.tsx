import React, { useState, useEffect } from 'react';
import { Card, Row, Col, List, Tag, Space, Typography, Tooltip, Collapse, Modal, Radio, Button, message } from 'antd';
import { HeartOutlined, StarOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getApiUrl } from '../../../config';

const { Panel } = Collapse;
import styled from '@emotion/styled';
import ReportCard from './ReportCard';

const { Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

interface TalentAnalysisProps {
  talentAnalysisData: any;
  elementAnalysisData: any;
  dimensionScores: Record<string, number>;
  dimensions: string[];
}

const TalentAnalysis: React.FC<TalentAnalysisProps> = ({
  talentAnalysisData,
  elementAnalysisData,
  dimensionScores,
  dimensions
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [confirmAnswer, setConfirmAnswer] = useState<number>();
  const [scales, setScales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getTagColor = (category: string) => {
    switch (category) {
      case '有喜欢有天赋':
        return 'success';
      case '没喜欢没天赋':
        return 'error';
      case '有喜欢没天赋':
        return 'warning';
      case '有天赋没喜欢':
        return 'processing';
      default:
        return 'default';
    }
  };

  const groupByDimension = (data: any[]) => {
    if (!data || !Array.isArray(data)) return {};
    return data.reduce((acc: any, curr: any) => {
      const dimension = curr.dimension;
      if (!acc[dimension]) {
        acc[dimension] = [];
      }
      acc[dimension].push(curr);
      return acc;
    }, {});
  };

  const handleElementClick = async (element: any) => {
    if (element.category === '待确认') {
      setSelectedElement(element);
      setLoading(true);
      try {
        const [likeScaleResponse, talentScaleResponse] = await Promise.all([
          axios.get(getApiUrl(`/scales?elementId=${element.element_id}`)),
          axios.get(getApiUrl(`/scales?elementId=${element.corresponding_Element_Id}`))
        ]);
        setScales([...likeScaleResponse.data, ...talentScaleResponse.data]);
      } catch (error) {
        console.error('获取量表失败:', error);
        message.error('获取量表失败');
      } finally {
        setLoading(false);
      }
      setIsModalVisible(true);
    }
  };

  const handleModalOk = () => {
    if (confirmAnswer) {
      // TODO: 保存用户的确认答案
      setIsModalVisible(false);
      setSelectedElement(null);
      setConfirmAnswer(undefined);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedElement(null);
    setConfirmAnswer(undefined);
  };

  const dimensionData = groupByDimension(elementAnalysisData) || {};

  return (
    <ReportCard title="天赋分析">
      <Row gutter={24}>
        <Col span={12}>
          <Card title="能力雷达图">
            {/* 雷达图已移除 */}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="天赋分布详情">
            <Collapse>
              {Object.entries(dimensionData).map(([dimension, elements]) => {
                // 确保 elements 是数组类型
                const elementArray = Array.isArray(elements) ? elements : [];
                
                return (
                  <Panel header={dimension} key={dimension}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {elementArray.map((element: any, index: number) => (
                        <Card
                          key={index}
                          size="small"
                          bordered={false}
                          style={{ background: '#f5f5f5', cursor: 'pointer' }}
                          onClick={() => handleElementClick(element)}
                        >
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                              <Space>
                                <Space>
                                  <Tooltip title="此项为喜欢">
                                    <StarOutlined style={{ color: '#ff4d4f' }} />
                                  </Tooltip>
                                  <Text strong>{element.like_element}</Text>
                                  <Text type="secondary">-</Text>
                                  <Tooltip title="此项为天赋">
                                    <StarOutlined style={{ color: '#1890ff' }} />
                                  </Tooltip>
                                  <Text>{element.talent_element}</Text>
                                </Space>
                              </Space>
                              <Tag color={getTagColor(element.category)}>
                                {element.category}
                              </Tag>
                            </Space>
                          </Space>
                        </Card>
                      ))}
                    </Space>
                  </Panel>
                );
              })}
            </Collapse>
          </Card>
        </Col>
      </Row>

      <Modal
        title="天赋确认评估"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        footer={[
          <Button key="cancel" onClick={handleModalCancel}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleModalOk}
            disabled={!confirmAnswer}
          >
            确认
          </Button>
        ]}
        width={800}
      >
        {selectedElement && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical">
                <Text strong>{selectedElement.like_element} - {selectedElement.talent_element}</Text>
                <Text type="secondary">维度：{selectedElement.dimension}</Text>
              </Space>
            </Card>
            
            {loading ? (
              <Card loading={true} />
            ) : (
              <Collapse defaultActiveKey={['0']}>
                {scales.map((scale, index) => (
                  <Panel 
                    header={
                      <Space>
                        <Text>{scale.type === 'like' ? '兴趣' : '天赋'}量表题目</Text>
                        <Tag color={scale.type === 'like' ? '#ff4d4f' : '#1890ff'}>
                          {scale.direction === 'positive' ? '正向' : '反向'}
                        </Tag>
                      </Space>
                    } 
                    key={index}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>{scale.content}</Text>
                      <Radio.Group
                        onChange={e => setConfirmAnswer(e.target.value)}
                        value={confirmAnswer}
                        style={{ marginTop: 16 }}
                      >
                        <Space direction="vertical">
                          <Radio value={1}>非常符合</Radio>
                          <Radio value={2}>比较符合</Radio>
                          <Radio value={3}>一般</Radio>
                          <Radio value={4}>不太符合</Radio>
                          <Radio value={5}>完全不符合</Radio>
                        </Space>
                      </Radio.Group>
                    </Space>
                  </Panel>
                ))}
              </Collapse>
            )}
          </Space>
        )}
      </Modal>
    </ReportCard>
  );
};

export default TalentAnalysis;