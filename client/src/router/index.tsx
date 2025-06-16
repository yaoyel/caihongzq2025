// @ts-nocheck
import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/login/index';
import HomePage from '../pages/index';
import ChatPage from '../pages/chat';
import QAAssessment from '../pages/assessment/qa';
import TeenQAAssessment from '../pages/assessment/qa-teen';
import AdultQAAssessment from '../pages/assessment/qa-adult';
import ScaleAssessment from '../pages/assessment/scale';
import AnalysisReport from '../pages/report/analysis_report';
import Scale168Assessment from '../pages/assessment/scale-168';
import HomeDiscover from '../pages/home';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/home',
    element: <HomePage />
  },
  {
    path: '/chat',
    element: <ChatPage />
  },
  {
    path: '/report',
    element: <ReportPage />
  },
  {
    path: '/assessment/qa',
    element: <QAAssessment />
  },
  {
    path: '/assessment/qa-teen',
    element: <TeenQAAssessment />
  },
  {
    path: '/assessment/qa-adult',
    element: <AdultQAAssessment />
  },
  {
    path: '/assessment/scale',
    element: <ScaleAssessment />
  },
  {
    path: '/assessment/scale168',
    element: <Scale168Assessment />
  },
  {
    path: '/default',
    element: <HomeDiscover />
  },
  {
    path: '/analysisReport',
    element: <AnalysisReport />
  }
]);

export default router;