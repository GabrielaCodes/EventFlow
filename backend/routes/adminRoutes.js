import express from 'express';
import { 
    getAnalytics, 
    assignStaff, 
    updateEventStatus, 
    getAttendanceLogs,
    createModificationRequest,
    approveEvent // ✅ Make sure to import this from controller
} from '../controllers/adminController.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Middleware: Protect ALL routes below for 'manager' role only
router.use(authenticate, authorize(['manager']));

// Dashboard & Analytics
router.get('/analytics', getAnalytics);

// Staff & Assignments
router.post('/assign-staff', assignStaff);
router.get('/attendance', getAttendanceLogs);

// Event Management
// ✅ Added this route so "Option A: Approve Event" works
router.post('/approve-event', approveEvent); 

router.patch('/event-status', updateEventStatus);
router.post('/modify', createModificationRequest); 

export default router;