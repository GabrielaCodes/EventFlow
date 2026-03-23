import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import {
    getPendingUsers, verifyUser, getAllUsers,
    getCategories, createCategory, deleteCategory,
    getSubtypes, createSubtype, deleteSubtype,
    getVenues, createVenue, deleteVenue,
    getAllEventsByManager // <-- Added import here
} from '../controllers/coordinatorController.js';

//Analytics
import { getLandingData } from '../controllers/coordinatorLandingController.js';

//Manager requests
import { getCoordinatorRequests, processRequest } from '../controllers/masterRequestController.js';
//view staff assignment
import { 
    // ... your other imports
    getEventStaff 
} from '../controllers/coordinatorController.js';
const router = express.Router();

// --------------------------------------------------------
// GLOBAL MIDDLEWARE FOR THIS ROUTER
// Every route below this will automatically be protected!
// --------------------------------------------------------
router.use(authenticate);
router.use(authorize(['chief_coordinator'])); 

// User Mgmt
router.get('/users', getAllUsers); 
router.get('/users/pending', getPendingUsers); 
router.patch('/users/verify', verifyUser);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// Subtypes
router.get('/subtypes', getSubtypes);
router.post('/subtypes', createSubtype);
router.delete('/subtypes/:id', deleteSubtype);

// Venues
router.get('/venues', getVenues);
router.post('/venues', createVenue);
router.delete('/venues/:id', deleteVenue);

// Manager Requests
router.get('/master-requests', getCoordinatorRequests);
router.patch('/master-requests/process', processRequest);

// Overview Landing page
router.get('/landing-data', getLandingData);

// Assigned Manager Workloads
// Notice how clean this is since the middleware is handled globally above!
router.get('/workloads', getAllEventsByManager);

//view staff assignment
router.get('/events/:eventId/staff', getEventStaff);

export default router;