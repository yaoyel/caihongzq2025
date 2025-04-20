import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/login/index';
import HomePage from '../pages/index';
import ChatPage from '../pages/chat';
import QAAssessment from '../pages/assessment/qa';
import TeenQAAssessment from '../pages/assessment/qa-teen';
import AdultQAAssessment from '../pages/assessment/qa-adult';
import ScaleAssessment from '../pages/assessment/scale';
import ReportPage from '../pages/report';
import Scale168Assessment from '../pages/assessment/scale-168';

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
  }
]);

export default router;