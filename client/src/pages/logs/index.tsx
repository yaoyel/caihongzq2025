import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Button, Space, message } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';

const { Title } = Typography;
const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: #fff;
`;

const StyledContent = styled(Content)`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

interface LogFile {
  name: string;
  size: number;
  lastModified: string;
  content?: string;
}

const LogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl('/logs'));
      setLogs(response.data);
    } catch (error) {
      console.error('获取日志列表失败:', error);
      message.error('获取日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: '最后修改时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: LogFile) => (
        <Button
          type="link"
          onClick={async () => {
            try {
              const response = await axios.get(getApiUrl(`/logs/${record.name}`));
              message.info({
                content: (
                  <div>
                    <h3>{`日志内容 - ${record.name}`}</h3>
                    <pre style={{ maxHeight: '60vh', overflow: 'auto' }}>
                      {response.data.content}
                    </pre>
                  </div>
                ),
                duration: 0,
                style: {
                  width: '80%',
                  maxWidth: '1000px'
                }
              });
            } catch (error) {
              console.error('获取日志内容失败:', error);
              message.error('获取日志内容失败');
            }
          }}
        >
          查看内容
        </Button>
      ),
    },
  ];

  return (
    <StyledLayout>
      <StyledContent>
        <HeaderContainer>
          <Space>
            <Button icon={<HomeOutlined />} onClick={() => navigate('/home')}>
              返回主页
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              系统日志
            </Title>
          </Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchLogs}
            loading={loading}
          >
            刷新
          </Button>
        </HeaderContainer>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="name"
          loading={loading}
          pagination={false}
        />
      </StyledContent>
    </StyledLayout>
  );
};

export default LogsPage;