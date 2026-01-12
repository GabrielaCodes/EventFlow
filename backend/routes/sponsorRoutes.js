import express from 'express';
import { getSponsorshipRequests, respondToRequest } from '../controllers/sponsorController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate, authorize(['sponsor']));

router.get('/requests', getSponsorshipRequests);
router.patch('/respond', respondToRequest);

export default router;