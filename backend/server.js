import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import eventRoutes from './routes/eventRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sponsorRoutes from './routes/sponsorRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sponsors', sponsorRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Event Management System API is running...');
});

// Start server (LAST)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
