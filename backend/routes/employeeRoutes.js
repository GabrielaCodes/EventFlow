import express from 'express';
import { getAssignedEvents } from '../controllers/eventController.js'; // Ensure this matches your file path
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requireApproval } from '../middleware/requireApproval.js'; // ✅ The new middleware

const router = express.Router();

// 1. Authenticate: Verify Token
// 2. Authorize: Ensure role is 'employee'
// 3. Require Approval: Ensure verification_status is 'verified'
router.use(authenticate, authorize(['employee']), requireApproval);

// --- ROUTES ---

// GET /api/employee/my-assignments
router.get('/my-assignments', getAssignedEvents); 

// Add other employee-only routes here in the future
// e.g., router.post('/check-in', checkInController);

export default router;