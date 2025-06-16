// @ts-nocheck
import React, { useEffect } from 'react';
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
import Scale168Assessment from './pages/assessment/scale-168';
import HomeDiscover from './pages/home';
import AnalysisReport from './pages/report/analysis_report';
import ProfessColleges from './pages/report/profess_colleges';
import LoveEnergy from './pages/report/love_energy';
const App: React.FC = () => {
  // 获取url输入的Query参数
  const getRequestQueryParams = (search: string) => {
    if (!search) {
      return {};
    }

    //获取url中"?"符后的字串
    // let theRequest = new Object();
    let theRequest: { [key: string]: any } = {};
    if (search.indexOf('?') != -1) {
      let str = search.slice(1);
      let strs = str.split('&');

      for (var i = 0; i < strs.length; i++) {
        theRequest[strs[i].split('=')[0]] = decodeURIComponent(strs[i].split('=')[1]);
      }
    }
    return theRequest;
  };

  const queryparams = getRequestQueryParams(decodeURIComponent(location.search)) as {
    code: string;
    [key: string]: any;
    fromShareLink: boolean;
  };

  useEffect(() => {
    console.log(queryparams);
  }, []);
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
