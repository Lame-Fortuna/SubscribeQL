import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../middleware/mySQL.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_secret
const router = express.Router();

// Plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await query('SELECT * FROM plans');
    res.status(200).json({ plans });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user in the DB
    const users = await query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];
    
    if (!user) {
      return res.status(401).send('Invalid credentials');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '48h' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default router;