import express from 'express';
import { getAnalytics, assignStaff, updateEventStatus, getAttendanceLogs } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate, authorize(['manager']));

router.get('/analytics', getAnalytics);
router.post('/assign-staff', assignStaff);
router.patch('/event-status', updateEventStatus);
router.get('/attendance', getAttendanceLogs);

export default router;