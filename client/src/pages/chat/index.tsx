// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Layout, Typography, Button, Input, List, Avatar, Space, message, Modal } from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  MessageOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;
const { Content, Sider } = Layout;
const StyledLayout = styled(Layout)`
  height: 100%;
  background: #fff;
  display: flex;
`;

const StyledSider = styled(Sider)<{ collapsed?: boolean }>`
  background: #fff;
  padding: 24px 0;
  height: 100vh;
  position: fixed;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 1px solid #f0f0f0;
  z-index: 1000;

  @media (max-width: 768px) {
    position: fixed;
    left: ${(props) => (props.collapsed ? '-300px' : '0')};
    transition: left 0.3s ease;
  }
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
  margin-left: 0;
  margin-right: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 0;
  height: 100vh;
  overflow: hidden;
  background: #fff;
`;

const MessageList = styled(List<Message>)`
  flex: 1;
  padding: 0 24px;
  background: #fff;
  overflow-y: auto;
  height: calc(100vh - 200px);

  &::-webkit-scrollbar {
    width: 6px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 3px;

    &:hover {
      background-color: #bfbfbf;
    }
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .ant-list-item {
    margin-bottom: 24px;
    padding: 0;
    background: #fff;
    border: none !important;

    &:first-child {
      margin-top: 20px;
    }

    &:last-child {
      margin-bottom: 32px;
    }
  }

  .ant-list-split .ant-list-item {
    border-bottom: none;
  }

  .ant-list {
    border: none;
  }
`;

const StyledMessageBubble = styled.div<{ isUser: boolean }>`
  background-color: ${(props) => (props.isUser ? '#e6f7ff' : '#f5f5f5')};
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
  border: 1px solid ${(props) => (props.isUser ? '#91d5ff' : '#e8e8e8')};
  max-width: 100%;

  .markdown-content {
    font-size: 12px;
    line-height: 1.4;
    color: #333;

    p {
      margin: 0;
      display: inline;
      white-space: pre-wrap;
      word-wrap: break-word;
      word-break: break-word;
    }

    code {
      font-size: 11px;
      background-color: rgba(0, 0, 0, 0.05);
      padding: 1px 3px;
      border-radius: 2px;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    }

    pre {
      padding: 8px;
      border-radius: 4px;
      margin: 4px 0;
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

// 1. 修改加载动画样式
const LoadingDots = styled.div`
  display: inline-block;
  font-size: 12px;
  color: #666;

  @keyframes dots {
    0% {
      content: '';
    }
    25% {
      content: '.';
    }
    50% {
      content: '..';
    }
    75% {
      content: '...';
    }
    100% {
      content: '';
    }
  }

  &::after {
    content: '';
    animation: dots 1.5s infinite;
  }
`;

// 2. 修改消息气泡组件中的加载显示
const MessageBubble: React.FC<{ message: Message }> = React.memo(
  ({ message }) => {
    return (
      <StyledMessageBubble isUser={message.isUser}>
        <div className="markdown-content">
          {message.content ? (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          ) : !message.isUser ? (
            <span>
              思考中
              <LoadingDots />
            </span>
          ) : null}
        </div>
      </StyledMessageBubble>
    );
  },
  (prevProps, nextProps) => {
    // 只有当消息内容发生变化时才重新渲染
    return prevProps.message.content === nextProps.message.content;
  }
);

const InputContainer = styled.div`
  padding: 16px;
  background: #fff;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
`;

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  thinking?: string;
  role: 'user' | 'assistant';
}

// 修改props接口
interface ChatPageProps {
  sessionId?: string;
  isModal?: boolean;
  initialPrompt?: string;
  onStreamingChange?: (streaming: boolean) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({
  sessionId,
  isModal = false,
  initialPrompt = '',
  onStreamingChange,
}) => {
  const messageListRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeChat, setActiveChat] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 使用 ref 存储最后一条消息的 DOM 元素引用
  const lastMessageRef = React.useRef<HTMLDivElement>(null);

  // 将 eventSource 提升为组件级变量，使用 useRef 而不是 useState
  // 这样可以避免重新渲染时的问题
  const eventSourceRef = useRef<EventSource | null>(null);

  // 定义关闭 EventSource 的函数
  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('关闭SSE连接');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // 设置 EventSource 的函数
  const setupEventSource = useCallback(() => {
    // 先关闭现有连接
    closeEventSource();

    const token = localStorage.getItem('new-token');
    if (!token) return;

    // 如果没有活动会话，不建立连接
    if (!activeChat) {
      console.log('没有活动会话，不建立SSE连接');
      return;
    }

    console.log(`建立SSE连接，会话ID: ${activeChat}`);
    const url = `${getApiUrl('/chat/stream')}?token=${encodeURIComponent(token)}&sessionId=${activeChat}`;
    const newEventSource = new EventSource(url);
    eventSourceRef.current = newEventSource;

    newEventSource.onopen = () => {
      console.log('SSE连接已建立');
    };

    let updateTimeout: NodeJS.Timeout;

    // 监听连接成功事件
    newEventSource.addEventListener('connected', (event) => {
      console.log('收到连接成功事件:', event.data);
    });

    // 监听消息更新事件
    newEventSource.addEventListener('message-update', (event) => {
      try {
        if (!event.data) return;

        let data;
        try {
          // 修复 JSON 解析逻辑
          const rawData = event.data;
          if (typeof rawData === 'string' && rawData.startsWith('data: ')) {
            // 如果数据以 'data: ' 开头，去掉这个前缀
            data = JSON.parse(rawData.slice(6));
          } else {
            // 否则直接解析
            data = JSON.parse(rawData);
          }
          console.log('成功解析的数据:', data);
        } catch (e) {
          console.error('JSON解析失败:', e, '原始数据:', event.data);
          return;
        }

        console.log('收到消息更新:', data);

        // 使用防抖处理更新
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];

            if (lastMessage && !lastMessage.isUser && lastMessage.content !== data.content) {
              console.log('更新消息内容:', data.content);
              // 创建新的消息数组，但只更新最后一条消息
              return [...prevMessages.slice(0, -1), { ...lastMessage, content: data.content }];
            }
            return prevMessages;
          });

          // 检查是否包含错误信息，如果有则停止加载状态
          if (
            data.content &&
            (data.content.includes('抱歉，处理您的请求时出现错误') ||
              data.content.includes('请求超时') ||
              data.content.includes('长时间未收到响应'))
          ) {
            console.log('检测到错误或超时消息，停止加载状态:', data.content);
            setIsLoading(false);
          } else if (data.content) {
            // 正常内容更新完成
            setIsLoading(false);
          }
        }, 50);
      } catch (error) {
        console.error('处理消息更新失败:', error);
        setIsLoading(false);
      }
    });

    // 添加通用消息事件监听器
    newEventSource.onmessage = (event) => {
      console.log('收到通用消息事件:', event.data);
      try {
        if (!event.data) return;

        let data;
        try {
          // 修复 JSON 解析逻辑
          const rawData = event.data;
          if (typeof rawData === 'string' && rawData.startsWith('data: ')) {
            // 如果数据以 'data: ' 开头，去掉这个前缀
            data = JSON.parse(rawData.slice(6));
          } else {
            // 否则直接解析
            data = JSON.parse(rawData);
          }
          console.log('成功解析的通用消息:', data);
        } catch (e) {
          console.error('通用消息JSON解析失败:', e, '原始数据:', event.data);
          return;
        }

        // 如果包含messageId和content字段，则视为消息更新
        if (data.messageId && data.content !== undefined) {
          console.log('通用事件中检测到消息更新:', data);

          // 使用与message-update事件相同的处理逻辑
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            setMessages((prevMessages) => {
              const lastMessage = prevMessages[prevMessages.length - 1];

              if (lastMessage && !lastMessage.isUser && lastMessage.content !== data.content) {
                return [...prevMessages.slice(0, -1), { ...lastMessage, content: data.content }];
              }
              return prevMessages;
            });

            // 检查是否包含错误信息
            if (
              data.content &&
              (data.content.includes('抱歉，处理您的请求时出现错误') ||
                data.content.includes('请求超时') ||
                data.content.includes('长时间未收到响应'))
            ) {
              console.log('通用事件中检测到错误或超时:', data.content);
              setIsLoading(false);
            } else if (data.content) {
              setIsLoading(false);
            }
          }, 50);
        }
      } catch (error) {
        console.error('处理通用消息事件失败:', error);
        setIsLoading(false);
      }
    };

    newEventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      closeEventSource();

      // 如果仍有活动会话，尝试重新连接
      if (activeChat) {
        setTimeout(setupEventSource, 3000);
      }
    };
  }, [activeChat, closeEventSource]);

  // 初始化和清理 EventSource
  useEffect(() => {
    if (activeChat) {
      setupEventSource();
    }

    return closeEventSource;
  }, [activeChat, setupEventSource, closeEventSource]);

  useEffect(() => {
    console.log('消息列表已更新:', messages);
  }, [messages]);

  useEffect(() => {
    // 如果传入了sessionId，则直接使用
    if (sessionId) {
      setActiveChat(sessionId);
    } else {
      fetchChats();
    }
  }, [sessionId]);

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

  // 修改useEffect，在组件挂载时设置初始prompt
  useEffect(() => {
    if (initialPrompt) {
      setInputValue(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (onStreamingChange) {
      onStreamingChange(isLoading);
    }
  }, [isLoading, onStreamingChange]);

  const getUserId = () => {
    const userStr = localStorage.getItem('new-user');
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
      const token = localStorage.getItem('new-token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const response = await axios.get(getApiUrl(`/chat/sessions/user/${userId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem('new-token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const response = await axios.get(getApiUrl(`/chat/sessions/${sessionId}/messages`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        const messages = response.data.map((msg: any) => ({
          id: Number(msg.id),
          content: msg.content,
          isUser: msg.role === 'user',
          role: msg.role as 'user' | 'assistant',
          timestamp: new Date(msg.createdAt),
          thinking: msg.thinking || '',
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
    e.preventDefault();
    setInputValue(e.target.value);
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || !activeChat || isLoading) return;

    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // 添加前端超时保护
    const frontendTimeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('前端超时保护触发');
        setIsLoading(false);
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && !lastMessage.isUser) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                content: lastMessage.content || '抱歉，响应超时。请稍后再试。',
              },
            ];
          }
          return prev;
        });
      }
    }, 60000); // 60秒前端超时保护

    // 1. 立即添加用户消息到界面
    const userMessage: Message = {
      id: Date.now(), // 临时ID
      content: currentInput,
      isUser: true,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    scrollToBottom();

    try {
      const response = await fetch(getApiUrl('/chat/messages'), {
        method: 'POST',
        body: JSON.stringify({
          userId: getUserId(),
          sessionId: activeChat,
          content: currentInput,
          role: 'user' as const,
        }),
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 2. 更新用户消息的真实ID，并添加AI消息占位
      setMessages((prev) => {
        const newMessages = prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, id: Number(data.userMessage.id) } : msg
        );

        return [
          ...newMessages,
          {
            id: Number(data.aiMessage.id),
            content: '',
            isUser: false,
            role: 'assistant',
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送失败');
      // 3. 发送失败时恢复输入
      setInputValue(currentInput);
      // 4. 移除失败的消息
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      setIsLoading(false);
      clearTimeout(frontendTimeoutId); // 清理超时保护
    }
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const createNewChat = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const token = localStorage.getItem('new-token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      const response = await axios.post(
        getApiUrl('/chat/sessions'),
        {
          userId,
          title: `新对话 ${new Date().toLocaleString()}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newChat = response.data;
      setChats((prev) => [newChat, ...prev]);
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
      const token = localStorage.getItem('new-token');
      if (!token) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      await axios.put(
        getApiUrl(`/chat/sessions/${editingChatId}`),
        {
          title: newChatTitle.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === editingChatId ? { ...chat, title: newChatTitle.trim() } : chat
        )
      );
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
    gap: 8px;
    max-width: 85%;

    .message-time {
      position: absolute;
      bottom: -16px;
      font-size: 11px;
      color: #999;
      ${(props) => (props.isUser ? 'right: 0' : 'left: 0')};
    }

    .delete-icon {
      opacity: 0;
      transition: opacity 0.2s;
      cursor: pointer;
      color: #ff4d4f;
      position: absolute;
      top: 0;
      ${(props) => (props.isUser ? 'left: -24px' : 'right: -24px')};
    }

    &:hover .delete-icon {
      opacity: 1;
    }
  `;

  // 添加获取认证信息的辅助函数
  const getAuthHeaders = () => {
    const token = localStorage.getItem('new-token');
    if (!token) {
      message.error('请先登录');
      throw new Error('未登录');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // 优化 MessageList 渲染
  const MessageListMemo = useMemo(
    () => (
      <MessageList
        ref={messageListRef}
        dataSource={messages}
        renderItem={(item: Message, index: number) => (
          <List.Item
            ref={index === messages.length - 1 ? lastMessageRef : null}
            style={{
              justifyContent: item.isUser ? 'flex-end' : 'flex-start',
              display: 'flex',
              marginBottom: '24px',
              border: 'none',
              borderBottom: 'none',
            }}
          >
            <MessageContainer isUser={item.isUser}>
              {!item.isUser && (
                <Avatar size={24} style={{ backgroundColor: '#1890ff', flexShrink: 0 }}>
                  AI
                </Avatar>
              )}
              <div style={{ position: 'relative' }}>
                <MessageBubble message={item} />
                <div className="message-time">
                  {new Date(item.timestamp).toLocaleString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </div>
              </div>
              {item.isUser && (
                <Avatar size={24} style={{ backgroundColor: '#52c41a', flexShrink: 0 }}>
                  我
                </Avatar>
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
                          headers: getAuthHeaders(),
                        });

                        if (!response.ok) {
                          if (response.status === 401) {
                            message.error('登录已过期，请重新登录');
                            navigate('/login');
                            return;
                          }
                          throw new Error(`删除失败: ${response.status}`);
                        }

                        setMessages((prev) => prev.filter((msg) => msg.id !== item.id));
                        message.success('删除成功');
                      } catch (error) {
                        console.error('删除消息失败:', error);
                        message.error('删除失败');
                      }
                    },
                  });
                }}
              />
            </MessageContainer>
          </List.Item>
        )}
      />
    ),
    [messages]
  );

  // 添加滚动到底部的函数
  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      const element = messageListRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, []);

  const ToggleButton = styled(Button)<{ $collapsed: boolean }>`
    position: fixed;
    left: 16px;
    top: 16px;
    z-index: 1001;
    display: none;
    background: transparent;
    border: none;
    box-shadow: none;
    color: #1890ff;
    padding: 0 12px;
    height: 48px;
    min-width: 48px;
    border-radius: 24px;
    justify-content: center;
    align-items: center;
    transition:
      background 0.2s,
      color 0.2s;

    &:hover {
      background: #f0f5ff;
      color: #40a9ff;
    }

    @media (max-width: 768px) {
      display: flex;
      flex-direction: ${(props) => (props.$collapsed ? 'row' : 'column')};
      gap: 4px;
    }
  `;
  const [collapsed, setCollapsed] = useState(false);

  const StyledMainLayout = styled(Layout)<{ collapsed?: boolean }>`
    margin-left: 300px;
    transition: margin-left 0.3s ease;

    @media (max-width: 768px) {
      margin-left: 0;
    }
  `;
  const SiderContentWrapper = styled('div')`
    @media (max-width: 768px) {
      margin-top: 78px;
    }
  `;
  return (
    <StyledLayout>
      <ToggleButton $collapsed={collapsed} onClick={() => setCollapsed(!collapsed)}>
        <MenuOutlined style={{ fontSize: 28 }} />
        <span
          style={{
            fontSize: 12,
            lineHeight: 1,
            textAlign: 'center',
            marginLeft: collapsed ? 8 : 0,
            marginTop: collapsed ? 0 : 4,
            color: '#333',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? '' : '收起'}
        </span>
      </ToggleButton>
      {!isModal && (
        <StyledSider width={300} collapsed={collapsed} collapsible={false} trigger={null}>
          <SiderContentWrapper>
            <div style={{ padding: '0 20px', marginBottom: 20 }}>
              <Button
                icon={<HomeOutlined />}
                onClick={() => navigate('/home')}
                style={{ marginBottom: '12px' }}
                block
              >
                返回主页
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={createNewChat} block>
                新建对话
              </Button>
            </div>
            <ChatList
              dataSource={chats}
              renderItem={(chat: any) => (
                <List.Item
                  className={chat.id === activeChat ? 'active' : ''}
                  onClick={() => {
                    setActiveChat(chat.id);
                    setCollapsed(true);
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
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
                                  const token = localStorage.getItem('new-token');
                                  if (!token) {
                                    message.error('请先登录');
                                    navigate('/login');
                                    return;
                                  }

                                  await axios.delete(getApiUrl(`/chat/sessions/${chat.id}`), {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  });
                                  setChats((prev) => prev.filter((c) => c.id !== chat.id));
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
                              },
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
          </SiderContentWrapper>
        </StyledSider>
      )}

      <ChatContainer style={{ marginLeft: 0 }}>
        {MessageListMemo}

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
          onChange={(e) => setNewChatTitle(e.target.value)}
          onPressEnter={handleModalOk}
        />
      </Modal>
    </StyledLayout>
  );
};

export default ChatPage;
