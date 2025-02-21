import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Input, List, Avatar, Card, Space, Divider, message, Modal } from 'antd';
import { SendOutlined, PlusOutlined, MessageOutlined, HomeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

const StyledLayout = styled(Layout)`
  height: 100vh;
  background: #fff;
`;

const StyledSider = styled(Sider)`
  background: #f5f5f5;
  border-right: 1px solid #e8e8e8;
  padding: 20px 0;
`;

const ChatList = styled(List)`
  .ant-list-item {
    padding: 12px 20px;
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 0;
    margin: 4px 8px;
    
    &:hover {
      background: #e6f7ff;
    }
    
    &.active {
      background: #e6f7ff;
    }
  }
`;

const MessageList = styled(List)`
  padding: 20px;
  height: calc(100vh - 180px);
  overflow-y: auto;
  
  .ant-list-item {
    margin-bottom: 20px;
  }
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  background-color: ${props => props.isUser ? '#e6f7ff' : '#f5f5f5'};
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 70%;
  word-break: break-word;
  white-space: pre-wrap;
  
  .markdown-content {
    font-size: 14px;
    line-height: 1.6;
    
    p {
      margin: 0 0 1em;
      white-space: pre-wrap;
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    code {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
      white-space: pre-wrap;
    }
    
    pre {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      
      code {
        background-color: transparent;
        padding: 0;
        white-space: pre;
      }
    }
    
    ul, ol {
      margin: 0 0 1em;
      padding-left: 20px;
    }
    
    blockquote {
      margin: 0 0 1em;
      padding-left: 12px;
      border-left: 4px solid #ddd;
      color: #666;
      white-space: pre-wrap;
    }
  }
`;

const InputArea = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: calc(100% - 300px);
  padding: 20px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  gap: 16px;
`;

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const messageListRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeChat, setActiveChat] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    // 当消息列表更新时，自动滚动到底部
    if (messageListRef.current) {
      const element = messageListRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  const fetchChats = async () => {
    try {
      const response = await axios.get(getApiUrl('/chat/sessions/user/1')); // TODO: 使用实际的用户ID
      setChats(response.data);
      if (response.data.length > 0) {
        setActiveChat(response.data[0].id);
      }
    } catch (error) {
      console.error('获取对话列表失败:', error);
      message.error('获取对话列表失败');
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await axios.get(getApiUrl(`/chat/sessions/${chatId}`));
      if (response.data && Array.isArray(response.data.messages)) {
        setMessages(response.data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.timestamp)
        })));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
      message.error('获取消息失败');
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    try {
      const response = await axios.post(getApiUrl('/chat/messages'), {
        content: inputValue,
        sessionId: Number(activeChat),
        role: "user", 
      });

      // 更新处理AI回复的数据结构
      const { aiMessage } = response.data;
      if (aiMessage) {
        setMessages(prev => [...prev, {
          id: aiMessage.id.toString(),
          content: aiMessage.content,
          isUser: false,
          timestamp: new Date(aiMessage.createdAt)
        }]);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败');
    }
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const createNewChat = async () => {
    try {
      const response = await axios.post(getApiUrl('/chat/sessions'), {
        userId: 1, // TODO: 使用实际的用户ID
        title: `新对话 ${new Date().toLocaleString()}`
      });

      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat.id);
      setMessages([]);
      
      // 确保消息列表滚动到底部
      if (messageListRef.current) {
        setTimeout(() => {
          const element = messageListRef.current;
          if (element) {
            element.scrollTop = element.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('创建对话失败:', error);
      message.error('创建对话失败');
    }
  };

  const [editingChatId, setEditingChatId] = useState<string>('');
  const handleModalOk = async () => {
    if (!newChatTitle.trim()) {
      message.warning('请输入对话标题');
      return;
    }

    try {
      await axios.put(getApiUrl(`/chat/sessions/${editingChatId}`), {
        title: newChatTitle.trim()
      });

      setChats(prev => prev.map(chat => 
        chat.id === editingChatId 
          ? { ...chat, title: newChatTitle.trim() }
          : chat
      ));
      setIsModalVisible(false);
      message.success('修改成功');
    } catch (error) {
      console.error('修改对话标题失败:', error);
      message.error('修改失败');
    }
  };

  return (
    <StyledLayout>
      <StyledSider width={300}>
        <div style={{ padding: '0 20px', marginBottom: 20 }}>
          <Button 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/home')}
            style={{ marginBottom: '12px' }}
            block
          >
            返回主页
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={createNewChat}
            block
          >
            新建对话
          </Button>
        </div>
        <ChatList
          dataSource={chats}
          renderItem={(chat:any) => (
            <List.Item
              className={chat.id === activeChat ? 'active' : ''}
              onClick={() => setActiveChat(chat.id)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Space>
                    <MessageOutlined />
                    <Text strong>{chat.title}</Text>
                  </Space>
                  <Space size="small">
                    <EditOutlined 
                      style={{ fontSize: '12px', color: '#666' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewChatTitle(chat.title);
                        setEditingChatId(chat.id);
                        setIsModalVisible(true);
                      }} 
                    />
                    <DeleteOutlined 
                      style={{ fontSize: '12px', color: 'rgba(255, 77, 79, 0.6)' }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        Modal.confirm({
                          title: '确认删除',
                          content: '确定要删除这个会话吗？此操作不可恢复。',
                          okText: '确定',
                          cancelText: '取消',
                          okType: 'danger',
                          async onOk() {
                            try {
                              await axios.delete(getApiUrl(`/chat/sessions/${chat.id}`));
                              setChats(prev => prev.filter(c => c.id !== chat.id));
                              if (activeChat === chat.id) {
                                setActiveChat('');
                                setMessages([]);
                              }
                              message.success('删除成功');
                            } catch (error) {
                              console.error('删除对话失败:', error);
                              message.error('删除失败');
                            }
                          }
                        });
                      }} 
                    />
                  </Space>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {chat.lastMessage}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      </StyledSider>
      <Layout>
        <Content style={{ position: 'relative' }}>
          <MessageList
            ref={messageListRef}
            dataSource={messages}
            renderItem={(message:any) => (
              <List.Item style={{ 
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                marginBottom: '16px'
              }}>
                <Space align="start">
                  {!message.isUser && (
                    <Avatar style={{ backgroundColor: '#1890ff' }}>
                      AI
                    </Avatar>
                  )}
                  <MessageBubble isUser={message.isUser} style={{
                    border: '2px solid #e8e8e8',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div className="markdown-content">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </MessageBubble>
                  {message.isUser && (
                    <Avatar style={{ backgroundColor: '#52c41a' }}>
                      我
                    </Avatar>
                  )}
                </Space>
              </List.Item>
            )}
            style={{ 
              padding: '20px',
              marginBottom: '80px',
              border: '2px solid #e8e8e8',
              borderRadius: '8px'
            }}
          />
          <InputArea style={{
            position: 'fixed',
            bottom: 0,
            left: '300px',
            right: 0,
            padding: '20px',
            backgroundColor: '#fff',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            border: '2px solid #e8e8e8',
            borderRadius: '8px 8px 0 0'
          }}>
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入消息..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ 
                flex: 1,
                marginRight: '12px',
                resize: 'none',
                border: '2px solid #d9d9d9',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '16px',
                minHeight: '60px',
                '&:hover, &:focus': {
                  borderColor: '#1890ff',
                  boxShadow: '0 0 0 2px rgba(24,144,255,0.2)'
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              发送
            </Button>
          </InputArea>
        </Content>
      </Layout>

      <Modal
        title="修改对话标题"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入对话标题"
          value={newChatTitle}
          onChange={e => setNewChatTitle(e.target.value)}
          onPressEnter={handleModalOk}
        />
      </Modal>
    </StyledLayout>
  );
};

export default ChatPage;