import express from 'express';
import { createUser, authenticateUser, getProfileByUserId } from '../auth.js';
import { generateToken } from '../auth.js';
import { getDb, COLLECTIONS } from '../db.js';

const router = express.Router();

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const trimmedFullName = fullName?.trim() || trimmedUsername;

    const { id } = await createUser(
      normalizedEmail,
      password,
      trimmedUsername,
      trimmedFullName
    );
    const profile = await getProfileByUserId(id);
    const token = generateToken(id);

    return res.json({
      user: { id, email: normalizedEmail },
      profile,
      token,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, profile } = await authenticateUser(email, password);
    const token = generateToken(user.id);

    // Update online status
    const db = getDb();
    await db.collection(COLLECTIONS.PROFILES).updateOne(
      { user_id: user.id },
      { $set: { is_online: true, last_seen: new Date().toISOString() } }
    );

    res.json({
      user,
      profile: { ...profile, is_online: true },
      token,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { verifyToken, getProfileByUserId } = await import('../auth.js');
    const { getDb, COLLECTIONS } = await import('../db.js');
    const { formatDocument } = await import('../models.js');
    const { ObjectId } = await import('mongodb');
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const db = getDb();
    const userId = decoded.userId;
    
    // Get user
    const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get profile
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ 
      user: formatDocument(user), 
      profile 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
