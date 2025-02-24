import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Input, List, Avatar, Space, message, Modal } from 'antd';
import { SendOutlined, PlusOutlined, MessageOutlined, HomeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;
const { Sider } = Layout;

const StyledLayout = styled(Layout)`
  height: 100vh;
  background: #fff;
  display: flex;
`;

const StyledSider = styled(Sider)`
  background: #f5f5f5;
  border-right: 1px solid #e8e8e8;
  padding: 20px 0;
  flex-shrink: 0;
  position: fixed;
  height: 100vh;
  z-index: 1;
`;

const ChatList = styled(List)`
  .ant-list-item {
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 0;
    margin: 3px 6px;
    
    &:hover {
      background: #e6f7ff;
    }
    
    &.active {
      background: #e6f7ff;
    }

    .ant-typography {
      font-size: 13px;
    }
  }
`;

const ChatContainer = styled(Layout)`
  margin-left: 300px;
  margin-right: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 0;
  min-height: 100vh;
`;

const MessageList = styled(List<Message>)`
  flex: 1;
  padding: 0 24px;
  background: #fff;
  overflow-y: auto;
  
  .ant-list-item {
    margin-bottom: 20px;
    padding: 0;

    &:first-child {
      margin-top: 24px;
    }
  }
`;

const StyledMessageBubble = styled.div<{ isUser: boolean }>`
  background-color: ${props => props.isUser ? '#e6f7ff' : '#f5f5f5'};
  padding: 10px 14px;
  border-radius: 10px;
  display: inline-block;
  border: 1px solid ${props => props.isUser ? '#91d5ff' : '#e8e8e8'};
  max-width: 100%;
  
  .markdown-content {
    font-size: 13px;
    line-height: 1.5;
    color: #333;
    
    p {
      margin: 0;
      display: inline;
      white-space: pre-wrap;
      word-wrap: break-word;
      word-break: break-word;
    }
    
    code {
      font-size: 12px;
      background-color: rgba(0, 0, 0, 0.05);
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    }
    
    pre {
      padding: 10px;
      border-radius: 4px;
      margin: 6px 0;
    }
  }

  .thinking {
    margin-bottom: 8px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    
    &-content {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      
      p {
        margin: 4px 0;
      }
    }
  }
`;

// 修改加载动画样式
const LoadingDots = styled.div`
  display: inline-block;
  font-size: 13px;
  color: #666;
  &::after {
    content: '...';
    animation: dots 1.5s steps(4, end) infinite;
  }
`;

// 修改消息气泡组件
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <StyledMessageBubble isUser={message.isUser}>
      <div className="markdown-content">
        {message.content ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : !message.isUser ? (
          <LoadingDots>思考中</LoadingDots>
        ) : null}
      </div>
    </StyledMessageBubble>
  );
};

const InputContainer = styled.div`
  padding: 16px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  
  .ant-input-textarea {
    flex: 1;
    textarea {
      padding: 10px 14px;
      font-size: 13px;
      min-height: 90px;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      resize: none;
      transition: all 0.3s ease;
      will-change: border-color;
      
      &:hover {
        border-color: #40a9ff;
      }
      
      &:focus {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24,144,255,0.1);
      }
    }
  }
  
  .send-button {
    height: auto;
    padding: 10px 14px;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 6px;
    
    .anticon {
      font-size: 14px;
    }
  }
`;

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  thinking?: string;
  role: 'user' | 'assistant';
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupEventSource = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('建立SSE连接...');
      eventSource = new EventSource(`${getApiUrl('/chat/stream')}?token=${encodeURIComponent(token)}`);

      eventSource.onopen = () => {
        console.log('SSE连接已建立');
      };

      eventSource.addEventListener('message-update', (event) => {
        try {
          if (!event.data) {
            console.log('收到空消息');
            return;
          }

          let data;
          try {
            const parsedData = JSON.parse(event.data);
            if (typeof parsedData === 'string' && parsedData.startsWith('data: ')) {
              data = JSON.parse(parsedData.slice(6));
            } else {
              data = parsedData;
            }
          } catch (e) {
            console.error('JSON解析失败:', e);
            return;
          }

          // 直接更新最后一条消息
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && !lastMessage.isUser) {
              lastMessage.content = data.content;
              if (data.content) {
                setIsLoading(false); // 收到内容时解除加载状态
              }
            }
            
            return newMessages;
          });

          // 滚动到底部
          requestAnimationFrame(() => {
            if (messageListRef.current) {
              messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
            }
          });

        } catch (error) {
          console.error('处理消息更新失败:', error);
          setIsLoading(false); // 出错时也解除加载状态
        }
      });

      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        eventSource?.close();
        setTimeout(setupEventSource, 3000);
      };
    };

    setupEventSource();
    return () => {
      console.log('关闭SSE连接');
      eventSource?.close();
    };
  }, []);

  useEffect(() => {
    console.log('消息列表已更新:', messages);
  }, [messages]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messageListRef.current) {
        const element = messageListRef.current;
        element.scrollTop = element.scrollHeight;
      }
    };

    requestAnimationFrame(scrollToBottom);
  }, [messages]);

  const getUserId = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      message.error('用户未登录');
      navigate('/login');
      return null;
    }
    const user = JSON.parse(userStr);
    return user.id;
  };

  const fetchChats = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const response = await axios.get(getApiUrl(`/chat/sessions/user/${userId}`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setChats(response.data);
      if (response.data.length > 0) {
        setActiveChat(response.data[0].id);
      }
    } catch (error) {
      console.error('获取对话列表失败:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
      } else {
        message.error('获取对话列表失败');
      }
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const response = await axios.get(getApiUrl(`/chat/sessions/${sessionId}/messages`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const messages = response.data.map((msg: any) => ({
          id: Number(msg.id),
          content: msg.content,
          isUser: msg.role === 'user',
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.createdAt),
          thinking: msg.thinking || ''
        }));
        console.log('获取到的消息:', messages);
        setMessages(messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
      message.error('获取消息失败');
    }
  };

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || !activeChat || isLoading) return;

    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
        const response = await fetch(getApiUrl('/chat/messages'), {
            method: 'POST',
            body: JSON.stringify({
                userId: getUserId(),
                sessionId: activeChat,
                content: currentInput,
                role: 'user' as const
            }),
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 立即更新消息列表
        const newMessages: Message[] = [
            {
                id: Number(data.userMessage.id),
                content: currentInput,
                isUser: true,
                role: 'user',
                timestamp: new Date()
            },
            {
                id: Number(data.aiMessage.id),
                content: '',
                isUser: false,
                role: 'assistant',
                timestamp: new Date()
            }
        ];

        // 直接更新消息列表，不需要重新获取
        setMessages(prev => [...prev, ...newMessages]);

        // 滚动到底部
        requestAnimationFrame(() => {
            if (messageListRef.current) {
                messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
            }
        });

    } catch (error) {
        console.error('发送消息失败:', error);
        message.error('发送失败');
        setInputValue(currentInput);
        setIsLoading(false);
    }
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const createNewChat = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const response = await axios.post(getApiUrl('/chat/sessions'), {
        userId,
        title: `新对话 ${new Date().toLocaleString()}`
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const newChat = response.data;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat.id);
      setMessages([]);
      
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
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
      } else {
        message.error('创建对话失败');
      }
    }
  };

  const [editingChatId, setEditingChatId] = useState<string>('');
  const handleModalOk = async () => {
    if (!newChatTitle.trim()) {
      message.warning('请输入对话标题');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      await axios.put(getApiUrl(`/chat/sessions/${editingChatId}`), {
        title: newChatTitle.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
      } else {
        message.error('修改失败');
      }
    }
  };

  // 修改消息气泡容器样式
  const MessageContainer = styled.div<{ isUser: boolean }>`
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    max-width: 90%;

    .delete-icon {
      opacity: 0;
      transition: opacity 0.2s;
      cursor: pointer;
      color: #ff4d4f;
      position: absolute;
      top: 0;
      ${props => props.isUser ? 'left: -24px' : 'right: -24px'};
    }

    &:hover .delete-icon {
      opacity: 1;
    }
  `;

  // 添加获取认证信息的辅助函数
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        message.error('请先登录');
        throw new Error('未登录');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
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
                              const token = localStorage.getItem('token');
                              if (!token) {
                                message.error('请先登录');
                                navigate('/login');
                                return;
                              }

                              await axios.delete(getApiUrl(`/chat/sessions/${chat.id}`), {
                                headers: {
                                  Authorization: `Bearer ${token}`
                                }
                              });
                              setChats(prev => prev.filter(c => c.id !== chat.id));
                              if (activeChat === chat.id) {
                                setActiveChat('');
                                setMessages([]);
                              }
                              message.success('删除成功');
                            } catch (error) {
                              console.error('删除对话失败:', error);
                              if (axios.isAxiosError(error) && error.response?.status === 401) {
                                message.error('登录已过期，请重新登录');
                                navigate('/login');
                              } else {
                                message.error('删除失败');
                              }
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
      
      <ChatContainer>
        <MessageList
          ref={messageListRef}
          dataSource={messages}
          renderItem={(item: Message) => (
            <List.Item style={{ 
              justifyContent: item.isUser ? 'flex-end' : 'flex-start',
              display: 'flex'
            }}>              
              <MessageContainer isUser={item.isUser}>
                {!item.isUser && (
                  <Avatar style={{ backgroundColor: '#1890ff', flexShrink: 0 }}>AI</Avatar>
                )}
                <MessageBubble message={item} />
                {item.isUser && (
                  <Avatar style={{ backgroundColor: '#52c41a', flexShrink: 0 }}>我</Avatar>
                )}
                <DeleteOutlined 
                  className="delete-icon"
                  onClick={() => {
                    Modal.confirm({
                      title: '确认删除',
                      content: '确定要删除这条消息吗？',
                      okText: '确定',
                      cancelText: '取消',
                      okType: 'danger',
                      onOk: async () => {
                        try {
                          const response = await fetch(getApiUrl(`/chat/messages/${item.id}`), {
                            method: 'DELETE',
                            headers: getAuthHeaders()
                          });

                          if (!response.ok) {
                            if (response.status === 401) {
                              message.error('登录已过期，请重新登录');
                              navigate('/login');
                              return;
                            }
                            throw new Error(`删除失败: ${response.status}`);
                          }

                          setMessages(prev => prev.filter(msg => msg.id !== item.id));
                          message.success('删除成功');
                        } catch (error) {
                          console.error('删除消息失败:', error);
                          message.error('删除失败');
                        }
                      }
                    });
                  }}
                />
              </MessageContainer>
            </List.Item>
          )}
        />
        
        <InputContainer>
          <Input.TextArea
            value={inputValue}
            onChange={handleInputChange}
            placeholder="输入消息..."
            autoSize={{ minRows: 4, maxRows: 8 }}
            disabled={isLoading}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || !activeChat || isLoading}
            className="send-button"
          >
            {isLoading ? '等待回复' : '发送'}
          </Button>
        </InputContainer>
      </ChatContainer>

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