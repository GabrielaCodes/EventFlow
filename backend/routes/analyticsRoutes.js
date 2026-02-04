import express from 'express';
import { getSystemAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate);

// Only Chief Coordinator can see system-wide analytics
router.get('/system-overview', authorize(['chief_coordinator']), getSystemAnalytics);

export default router;