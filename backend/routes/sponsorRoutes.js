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

router.use(authenticate);

// --- MANAGER ROUTES ---
// 1. List Sponsors
router.get('/list', authorize(['manager', 'chief_coordinator']), getSponsorsList);

// 2. Create/Update Request (Logic inside controller checks category)
router.post('/request', authorize(['manager']), sendSponsorshipRequest);

// 3. View History (Logic inside controller filters by category)
router.get('/sent-requests', authorize(['manager']), getManagerRequests);

// --- SPONSOR ROUTES ---
router.get('/requests', authorize(['sponsor']), getSponsorRequests);
router.patch('/respond', authorize(['sponsor']), respondToSponsorship);

export default router;