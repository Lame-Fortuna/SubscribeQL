import express from 'express';
import { query } from '../middleware/mySQL.js';
import { verifyToken } from '../middleware/auth.js';  // Assuming this middleware exists

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

    // Insert subscription into the database
    const planId = plans[0].id;
    const result = await query(
      'INSERT INTO subscriptions (user_id, plan_id, status) VALUES (?, ?, ?)', 
      [userId, planId, 'ACTIVE']
    );

    // Fix: Destructure the first element (result) correctly
    const subscriptionResult = result[0];  // This would be your subscription result, like affected rows or insertId.
    
    res.status(201).send({
      message: 'Subscription created',
      subscription: {
        id: subscriptionResult.insertId,
        user_id: userId,
        plan_id: planId,
        status: 'ACTIVE'
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
    // Fetch subscription details
    const subscriptions = await query(
      'SELECT s.*, p.name AS plan_name FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.user_id = ? AND s.status = ?',
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
    // Check if the plan exists
    const plans = await query('SELECT * FROM plans WHERE name = ?', [plan]);

    if (!plans.length) {
      return res.status(400).send('Invalid Plan');
    }

    // Update the subscription
    const planId = plans[0].id;
    await query(
      'UPDATE subscriptions SET plan_id = ? WHERE user_id = ? AND status = ?',
      [planId, userId, 'ACTIVE']
    );

    res.json({
      message: 'Subscription updated',
      subscription: {
        userId,
        plan: plan,
        status: 'ACTIVE'
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
    // Delete the subscription
    const result = await query(
      'DELETE FROM subscriptions WHERE user_id = ? AND status = ?',
      [userId, 'ACTIVE']
    );

    if (result.affectedRows === 0) {
      return res.status(404).send('Subscription not found');
    }

    res.json({ message: 'Subscription cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


export default router;