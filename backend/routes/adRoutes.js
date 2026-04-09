import express from 'express';
import { analyzeProposal } from '../controllers/adController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Require authentication for all routes in this file
router.use(authenticate);

// Only sponsors should be generating counter-offers
router.post('/analyze-proposal', authorize(['sponsor']), analyzeProposal);

export default router;