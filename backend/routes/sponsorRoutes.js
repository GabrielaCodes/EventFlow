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
router.get('/list', authorize(['manager']), getSponsorsList);
router.post('/request', authorize(['manager']), sendSponsorshipRequest);
router.get('/sent-requests', authorize(['manager']), getManagerRequests);

// --- SPONSOR ROUTES ---
router.get('/requests', authorize(['sponsor']), getSponsorRequests);
router.patch('/respond', authorize(['sponsor']), respondToSponsorship);

export default router;