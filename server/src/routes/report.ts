import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';

const router = Router();
const reportController = new ReportController();

router.get('/talent-analysis/:userId', (req, res) => 
  reportController.getTalentAnalysis(req, res)
);

router.get('/report/:userId', (req, res) =>
  reportController.getReport(req, res)
);

export default router; 