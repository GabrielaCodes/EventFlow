import express from 'express';
import { createEvent, getMyEvents, getAssignedEvents, requestModification } from '../controllers/eventController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Client routes
router.post('/', authenticate, authorize(['client']), createEvent);
router.get('/my-events', authenticate, authorize(['client']), getMyEvents);

// Employee routes
router.get('/assigned', authenticate, authorize(['employee']), getAssignedEvents);
router.post('/modify', authenticate, authorize(['employee']), requestModification);

export default router;