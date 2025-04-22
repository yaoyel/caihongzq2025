import React, { useState, useEffect } from 'react';
import { Layout, Typography, Steps, Card, Radio, Progress, Space, Button, Divider, Menu, message, Row, Tooltip } from 'antd';
import type { MenuItemProps } from 'antd';
// ... existing code ... 

const [loading, setLoading] = useState(true);
const questionsPerPage = 3; // 每页显示3个问题
const [savingStatus, setSavingStatus] = useState<Record<number, 'saving' | 'saved' | 'error'>>({});

useEffect(() => {
  // 先加载问题
  fetchAllQuestions();
}, []);

// ... existing code ... 