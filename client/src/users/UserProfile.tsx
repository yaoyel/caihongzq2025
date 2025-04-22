import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal } from 'antd';
import styled from '@emotion/styled';

const { Title } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
  }
`;

interface UserInfo {
  name: string;
}

const UserProfile: React.FC = () => {
  const [userForm] = Form.useForm<UserInfo>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [familyName, setFamilyName] = useState('');

  const handleUserSubmit = async () => {
    try {
      // TODO: 调用API保存用户信息
      message.success('用户信息保存成功');
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  const handleAddFamily = async () => {
    if (!familyName.trim()) {
      message.error('请输入家庭名称');
      return;
    }

    try {
      // TODO: 调用API保存家庭信息
      message.success('家庭信息保存成功');
      setIsModalVisible(false);
      setFamilyName('');
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>用户信息管理</Title>
      
      <StyledCard title="基本信息">
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleUserSubmit}
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存基本信息
            </Button>
          </Form.Item>
        </Form>
      </StyledCard>

      <StyledCard title="家庭信息">
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          添加家庭
        </Button>

        <Modal
          title="添加家庭"
          open={isModalVisible}
          onOk={handleAddFamily}
          onCancel={() => {
            setIsModalVisible(false);
            setFamilyName('');
          }}
        >
          <Form layout="vertical">
            <Form.Item
              label="家庭名称"
              required
            >
              <Input
                placeholder="请输入家庭名称"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
              />
            </Form.Item>
          </Form>
        </Modal>
      </StyledCard>
    </div>
  );
};

export default UserProfile;