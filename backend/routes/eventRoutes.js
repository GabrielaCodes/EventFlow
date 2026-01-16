import express from 'express';
// 1. Import the new function
import { 
    createEvent, 
    getMyEvents, 
    getAssignedEvents, 
    requestModification,
    respondToModification, // 👈 Import this!
    getEventModifications  // 👈 Import this!
} from '../controllers/eventController.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Client routes
router.post('/', authenticate, authorize(['client']), createEvent);
router.get('/my-events', authenticate, authorize(['client']), getMyEvents);

// ✅ NEW: Client Response Routes
router.post('/respond', authenticate, authorize(['client']), respondToModification);

// ✅ NEW: Get Modifications (Shared: Manager needs to see them too, or handle in adminRoutes)
// Since both need it, it's safer to allow both or handle distinct routes. 
// For simplicity, let's allow authenticated users to view mod status if they have access to the event.
router.get('/:event_id/modifications', authenticate, getEventModifications);


// Employee routes
router.get('/assigned', authenticate, authorize(['employee']), getAssignedEvents);
// This existing route handles EMPLOYEE requests. Managers use the admin route now.
router.post('/modify', authenticate, authorize(['employee']), requestModification);

export default router;