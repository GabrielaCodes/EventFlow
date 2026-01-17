import express from 'express';
import { 
    createEvent, 
    getMyEvents, 
    getAssignedEvents, 
    requestModification,
    respondToModification, 
    getEventModifications 
} from '../controllers/eventController.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// --- Client Routes ---
router.post('/', authenticate, authorize(['client']), createEvent);
router.get('/my-events', authenticate, authorize(['client']), getMyEvents);
router.post('/respond', authenticate, authorize(['client']), respondToModification);

// --- Shared/General Routes ---
// Allow authenticated users (Clients/Employees/Admins) to view modification status if they have access
router.get('/:event_id/modifications', authenticate, getEventModifications);

// --- Employee Routes ---
router.get('/assigned', authenticate, authorize(['employee']), getAssignedEvents);
router.post('/modify', authenticate, authorize(['employee']), requestModification);

export default router;