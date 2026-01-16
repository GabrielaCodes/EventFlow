import express from 'express';
import { 
    getAnalytics, 
    assignStaff, 
    updateEventStatus, 
    getAttendanceLogs,
    createModificationRequest // ✅ Ensure this is imported
} from '../controllers/adminController.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// --------------------------------------------------------
// Middleware: Protect ALL routes below for 'manager' role only
// --------------------------------------------------------
router.use(authenticate, authorize(['manager']));

// --------------------------------------------------------
// Dashboard & Analytics
// --------------------------------------------------------
router.get('/analytics', getAnalytics);

// --------------------------------------------------------
// Staff & Assignments
// --------------------------------------------------------
router.post('/assign-staff', assignStaff);
router.get('/attendance', getAttendanceLogs);

// --------------------------------------------------------
// Event Management (Status & Modifications)
// --------------------------------------------------------
router.patch('/event-status', updateEventStatus);

// ✅ This enables the Manager to send modification proposals
// Endpoint: POST /api/admin/modify
router.post('/modify', createModificationRequest); 

export default router;