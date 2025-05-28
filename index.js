import express from 'express';
import dotenv from 'dotenv';
import authAndPlans from './routes/login.js';
import subscriptions from './routes/crud.js';

dotenv.config();

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Use the routes
app.use('/api', authAndPlans);
app.use('/api', subscriptions);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});