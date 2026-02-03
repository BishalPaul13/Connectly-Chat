import express from 'express';
import { verifyToken } from '../auth.js';
import { getDb, COLLECTIONS } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Middleware to verify authentication
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.userId;
  next();
}

// Update typing indicator
router.post('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { conversation_id, is_typing } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }

    await db.collection(COLLECTIONS.TYPING_INDICATORS).updateOne(
      {
        conversation_id,
        user_id: req.userId,
      },
      {
        $set: {
          conversation_id,
          user_id: req.userId,
          is_typing: is_typing ?? false,
          updated_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // Emit socket event for real-time typing indicators
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversation_id}`).emit('typing', {
        conversation_id,
        user_id: req.userId,
        is_typing: is_typing ?? false,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
