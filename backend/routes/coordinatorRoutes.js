import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import {
    getPendingUsers, verifyUser, getAllUsers,
    getCategories, createCategory, deleteCategory,
    getSubtypes, createSubtype, deleteSubtype,
    getVenues, createVenue, deleteVenue
} from '../controllers/coordinatorController.js';

import { getCoordinatorRequests, processRequest } from '../controllers/masterRequestController.js';
const router = express.Router();

router.use(authenticate);
// Ensure only Chief Coordinator can hit these
router.use(authorize(['chief_coordinator'])); 

// User Mgmt
router.get('/users', getAllUsers); 
router.get('/users/pending', getPendingUsers); // Fixed path
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
export default router;