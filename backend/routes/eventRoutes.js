import express from 'express';
import { 
    createEvent, 
    getMyEvents, 
    getAssignedEvents, 
    requestModification,
    respondToModification, 
    updateEvent,
    getEventModifications,
    submitFinancePlan, 
    respondToFinancePlan
} from '../controllers/eventController.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// --- Client Routes ---
router.post('/', authenticate, authorize(['client']), createEvent);
router.get('/my-events', authenticate, authorize(['client']), getMyEvents);
router.post('/respond', authenticate, authorize(['client']), respondToModification);
router.patch('/:id', authenticate, authorize(['client']), updateEvent);
router.post('/:id/finance/submit', authenticate, authorize(['manager']), submitFinancePlan);
router.post('/:id/finance/respond', authenticate, authorize(['client']), respondToFinancePlan);

// --- Shared/General Routes ---
router.get('/:event_id/modifications', authenticate, getEventModifications);

// --- Employee Routes ---
router.get('/assigned', authenticate, authorize(['employee']), getAssignedEvents);
router.post('/modify', authenticate, authorize(['employee']), requestModification);

export default router;