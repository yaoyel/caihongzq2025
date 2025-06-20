// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages';
import LoginPage from './pages/login';
import AssessmentPage from './pages/assessment';
import ScaleAssessment from './pages/assessment/scale';
import QAAssessment from './pages/assessment/qa';
import ReportPage from './pages/report';
import TeenQAAssessment from './pages/assessment/qa-teen';
import ChatPage from './pages/chat';
import AdultQAAssessment from './pages/assessment/qa-adult';
import UserProfile from './users/UserProfile';
import Scale168Assessment from './pages/assessment/scale-168';
import HomeDiscover from './pages/home';
import AnalysisReport from './pages/report/analysis_report';
import ProfessColleges from './pages/report/profess_colleges';
import LoveEnergy from './pages/report/love_energy';
import { handleWechatCallback } from './config';
const App: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const token = localStorage.getItem('new-token');
    const userStr = localStorage.getItem('new-user');

    const handleCallback = async () => {
      if (code) {
        setIsLoading(true);
        try {
          const result = await handleWechatCallback(code);
          if (result.code == 200 && result.data.token) {
            localStorage.setItem('new-token', result.data.token);
            localStorage.setItem('new-user', JSON.stringify(result.data.user));

            console.log('登录成功:', result.data.user);

            // 从URL参数中获取目标页面，如果没有则默认跳转到home
            const targetPath = urlParams.get('redirect') || urlParams.get('path') || '/default';
            navigate(targetPath);
          }
        } catch (error) {
          console.error('登录失败:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (code && (!token || !userStr)) {
      handleCallback();
    }
  }, [navigate]);

  // 显示loading状态
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        登录中...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/assessment/scale" element={<ScaleAssessment />} />
      <Route path="/assessment/scale168" element={<Scale168Assessment />} />
      <Route path="/assessment/qa" element={<QAAssessment />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/assessment/qa-teen" element={<TeenQAAssessment />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/assessment/qa-adult" element={<AdultQAAssessment />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/default" element={<HomeDiscover />} />
      <Route path="/analysisReport" element={<AnalysisReport />} />
      <Route path="/professColleges" element={<ProfessColleges />} />
      <Route path="/loveEnergy" element={<LoveEnergy />} />
    </Routes>
  );
};

export default App;
