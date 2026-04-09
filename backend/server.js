import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import eventRoutes from './routes/eventRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sponsorRoutes from './routes/sponsorRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js'; 
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import adRoutes from './routes/adRoutes.js';

import analyticsRoutes from './routes/analyticsRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true
}));

// 👇 THIS IS THE FIX 👇
// Increased the JSON payload limit to handle Base64 image strings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/employee', employeeRoutes); 
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/ad', adRoutes);
// Health check
app.get('/', (req, res) => {
  res.send('Event Management System API is running...');
});

// Start server (LAST)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});