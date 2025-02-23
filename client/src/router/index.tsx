import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/login';
import HomePage from '../pages/index';
import ChatPage from '../pages/chat';
import QAAssessment from '../pages/assessment/qa';
import TeenQAAssessment from '../pages/assessment/qa-teen';
import AdultQAAssessment from '../pages/assessment/qa-adult';
import ScaleAssessment from '../pages/assessment/scale';

const router = createBrowserRouter([
  {
    path: '/',
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
  }
]);

export default router;