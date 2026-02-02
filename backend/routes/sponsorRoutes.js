import express from 'express';
import { 
    getSponsorsList,
    sendSponsorshipRequest,
    getSponsorRequests,
    respondToSponsorship,
    getManagerRequests
} from '../controllers/sponsorController.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Middleware: All routes require login
router.use(authenticate);

// --- MANAGER ROUTES ---
// List all sponsors to choose from
router.get('/list', authorize(['manager']), getSponsorsList);
// Send a request
router.post('/request', authorize(['manager']), sendSponsorshipRequest);
// --- MANAGER ROUTES ---
router.get('/list', authorize(['manager']), getSponsorsList);
router.post('/request', authorize(['manager']), sendSponsorshipRequest);
router.get('/sent-requests', authorize(['manager']), getManagerRequests); // ✅ NEW ROUTE
// --- SPONSOR ROUTES ---
// View my requests
router.get('/requests', authorize(['sponsor']), getSponsorRequests);
// Accept/Reject
router.patch('/respond', authorize(['sponsor']), respondToSponsorship);

export default router;