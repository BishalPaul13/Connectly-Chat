import express from 'express';
import { verifyToken } from '../auth.js';
import { getDb, COLLECTIONS } from '../db.js';
import { formatDocument, formatDocuments } from '../models.js';

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

// Get all profiles (for searching users)
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { search, excludeUserId } = req.query;

    let query = { user_id: { $ne: excludeUserId || req.userId } };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { full_name: { $regex: search, $options: 'i' } },
      ];
    }

    const profiles = await db.collection(COLLECTIONS.PROFILES)
      .find(query)
      .limit(20)
      .toArray();

    res.json(formatDocuments(profiles));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile by user ID
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const profile = await db.collection(COLLECTIONS.PROFILES)
      .findOne({ user_id: req.params.userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(formatDocument(profile));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.patch('/:userId', authenticate, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const db = getDb();
    const update = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    await db.collection(COLLECTIONS.PROFILES).updateOne(
      { user_id: req.params.userId },
      { $set: update }
    );

    const profile = await db.collection(COLLECTIONS.PROFILES)
      .findOne({ user_id: req.params.userId });

    res.json(formatDocument(profile));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update online status
router.patch('/:userId/status', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { is_online } = req.body;

    await db.collection(COLLECTIONS.PROFILES).updateOne(
      { user_id: req.params.userId },
      { 
        $set: { 
          is_online: is_online ?? false,
          last_seen: new Date().toISOString(),
        } 
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
