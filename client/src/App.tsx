import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/assessment/scale" element={<ScaleAssessment />} />
      <Route path="/assessment/qa" element={<QAAssessment />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/assessment/qa-teen" element={<TeenQAAssessment />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/assessment/qa-adult" element={<AdultQAAssessment />} />
      <Route path="/profile" element={<UserProfile />} />
    </Routes>
  );
};

export default App;