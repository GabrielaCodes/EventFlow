import express from 'express';
import { 
    getAnalytics, 
    assignStaff, 
    updateEventStatus, 
    getAttendanceLogs,
    createModificationRequest,
    approveEvent,
    getPendingEmployees,
    getManagedEmployees,
    verifyEmployee
} from '../controllers/adminController.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createRequest, getMyRequests } from '../controllers/masterRequestController.js';
const router = express.Router();

// Middleware: Protect ALL routes below for 'manager' role only
router.use(authenticate, authorize(['manager']));

// Dashboard & Analytics
router.get('/analytics', getAnalytics);

// Employee Verification (NEW ✅)
router.get('/employees/pending', getPendingEmployees);
router.get('/employees/managed', getManagedEmployees);
router.post('/employees/verify', verifyEmployee);

// Staff & Assignments
router.post('/assign-staff', assignStaff);
router.get('/attendance', getAttendanceLogs);

// Event Management
router.post('/approve-event', approveEvent); 
router.patch('/event-status', updateEventStatus);
router.post('/modify', createModificationRequest); 
// Manger request for venue,event
router.post('/master-request', createRequest);
router.get('/master-requests', getMyRequests);

export default router;
