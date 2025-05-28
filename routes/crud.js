import express from 'express';
import { query } from '../middleware/mySQL.js';
import { verifyToken } from '../middleware/auth.js';
import redisClient from '../middleware/redisClient.js';

const router = express.Router();

// Subscribe
router.post('/subscriptions/:userId', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const { plan } = req.body;

  if (!plan) {
    return res.status(400).send('Plan is required');
  }

  try {
    // Check if the plan is valid
    const plans = await query('SELECT * FROM plans WHERE name = ?', [plan]);

    if (!plans.length) {
      return res.status(400).send('Invalid Plan');
    }

    const planDetails = plans[0];
    const planId = planDetails.id;
    const durationInSeconds = planDetails.duration * 86400; // Convert days to seconds

    // Insert subscription into DB
    const result = await query(
      'INSERT INTO subscriptions (user_id, plan_id, status, start_date) VALUES (?, ?, ?, NOW())',
      [userId, planId, 'ACTIVE']
    );

    const insertId = result.insertId;

    // Set Redis expiration key
    const redisKey = `subscription:${userId}`;
    await redisClient.set(redisKey, 'ACTIVE', 'EX', durationInSeconds);

    res.status(201).json({
      message: 'Subscription created',
      subscription: {
        id: insertId,
        user_id: userId,
        plan_id: planId,
        status: 'ACTIVE',
        expires_in_days: planDetails.duration
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Current Subscription
router.get('/subscriptions/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    // Check Redis first
    const redisStatus = await redisClient.get(`subscription:${userId}`);

    if (!redisStatus) {
      // Update DB status to EXPIRED
      await query('UPDATE subscriptions SET status = ? WHERE user_id = ? AND status = ?', ['EXPIRED', userId, 'ACTIVE']);
      return res.status(404).send('Subscription expired');
    }

    // Fetch subscription from DB
    const subscriptions = await query(
      `SELECT s.*, p.name AS plan_name 
       FROM subscriptions s 
       JOIN plans p ON s.plan_id = p.id 
       WHERE s.user_id = ? AND s.status = ?`,
      [userId, 'ACTIVE']
    );

    if (!subscriptions.length) {
      return res.status(404).send('Subscription not found');
    }

    res.json(subscriptions[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update Subscription
router.put('/subscriptions/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const { plan } = req.body;

  if (!plan) {
    return res.status(400).send('Plan is required');
  }

  try {
    const plans = await query('SELECT * FROM plans WHERE name = ?', [plan]);

    if (!plans.length) {
      return res.status(400).send('Invalid Plan');
    }

    const planDetails = plans[0];
    const planId = planDetails.id;
    const durationInSeconds = planDetails.duration * 86400;

    await query(
      'UPDATE subscriptions SET plan_id = ?, start_date = NOW(), status = ? WHERE user_id = ? AND status = ?',
      [planId, 'ACTIVE', userId, 'ACTIVE']
    );

    // Reset Redis TTL
    await redisClient.set(`subscription:${userId}`, 'ACTIVE', 'EX', durationInSeconds);

    res.json({
      message: 'Subscription updated',
      subscription: {
        userId,
        plan: plan,
        status: 'ACTIVE',
        expires_in_days: planDetails.duration
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Cancel Subscription
router.delete('/subscriptions/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await query(
      'UPDATE subscriptions SET status = ? WHERE user_id = ? AND status = ?',
      ['CANCELLED', userId, 'ACTIVE']
    );

    if (result.affectedRows === 0) {
      return res.status(404).send('Subscription not found');
    }

    // Delete Redis key
    await redisClient.del(`subscription:${userId}`);

    res.json({ message: 'Subscription cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default router;
