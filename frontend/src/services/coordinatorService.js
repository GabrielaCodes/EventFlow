import api from './api'; // Adjust path if your api.js is elsewhere

// 1. Overview & Stats
export const getCoordinatorStats = () => api.get('/coordinator/analytics/overview');

// 2. User Management (Approvals & Directory)
// ✅ UPDATED: Accepts status (default to 'pending' to keep old behavior working if needed)
export const getPendingUsers = (status = 'pending') => api.get(`/coordinator/users/pending?status=${status}`);
export const getAllUsers = (role) => api.get(`/coordinator/users?role=${role || ''}`);
export const verifyUser = (userId, action) => api.patch('/coordinator/users/verify', { userId, action });

// 3. Master Data (Categories & Venues)
export const getCategories = () => api.get('/coordinator/categories');
export const createCategory = (data) => api.post('/coordinator/categories', data);
export const deleteCategory = (id) => api.delete(`/coordinator/categories/${id}`);

export const getVenues = () => api.get('/coordinator/venues');
export const createVenue = (data) => api.post('/coordinator/venues', data);
export const deleteVenue = (id) => api.delete(`/coordinator/venues/${id}`);

// 4. Subtypes
// This assumes your backend has these endpoints (we will build them later if needed)
export const getSubtypes = () => api.get('/coordinator/subtypes');
export const createSubtype = (data) => api.post('/coordinator/subtypes', data);
export const deleteSubtype = (id) => api.delete(`/coordinator/subtypes/${id}`);