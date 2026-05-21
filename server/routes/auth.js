import express from 'express';
import { createUser, authenticateUser, getProfileByUserId } from '../auth.js';
import { generateToken } from '../auth.js';
import { getDb, COLLECTIONS } from '../db.js';
import { sendSignupOtpEmail } from '../email.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_SECONDS = 60;

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

// Request signup OTP
router.post('/signup/request-otp', async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const trimmedUsername = username.trim();
    const trimmedFullName = fullName?.trim() || null;
    if (!trimmedUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const db = getDb();
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await db.collection(COLLECTIONS.USERS).findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const existingProfile = await db.collection(COLLECTIONS.PROFILES).findOne({ username: trimmedUsername });
    if (existingProfile) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const now = Date.now();
    const existingOtp = await db.collection(COLLECTIONS.SIGNUP_OTPS).findOne({
      email: normalizedEmail,
    });

    if (existingOtp && existingOtp.lastSentAt && (now - new Date(existingOtp.lastSentAt).getTime()) < OTP_RESEND_SECONDS * 1000) {
      return res
        .status(429)
        .json({ error: `Please wait ${OTP_RESEND_SECONDS} seconds before requesting a new code.` });
    }

    const otpCode = generateOtpCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const passwordHash = await bcrypt.hash(password, 10);
    const nowIso = new Date(now).toISOString();
    const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    await db.collection(COLLECTIONS.SIGNUP_OTPS).updateOne(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          username: trimmedUsername,
          fullName: trimmedFullName,
          passwordHash,
          otpHash,
          expiresAt,
          attempts: 0,
          lastSentAt: nowIso,
          updatedAt: nowIso,
        },
        $setOnInsert: {
          createdAt: nowIso,
        },
      },
      { upsert: true }
    );

    try {
      await sendSignupOtpEmail(normalizedEmail, otpCode);
    } catch (emailError) {
      console.error('Signup OTP email failed:', emailError);
      await db.collection(COLLECTIONS.SIGNUP_OTPS).deleteOne({ email: normalizedEmail });

      return res.status(503).json({
        error: 'Unable to send verification code right now. Please try again later.',
      });
    }

    return res.json({
      message: 'Verification code sent to your email.',
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Verify signup OTP and create account
router.post('/signup/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const db = getDb();
    const normalizedEmail = normalizeEmail(email);
    const otpEntry = await db.collection(COLLECTIONS.SIGNUP_OTPS).findOne({ email: normalizedEmail });

    if (!otpEntry) {
      return res.status(400).json({ error: 'No pending signup found for this email' });
    }

    if (new Date(otpEntry.expiresAt).getTime() < Date.now()) {
      await db.collection(COLLECTIONS.SIGNUP_OTPS).deleteOne({ email: normalizedEmail });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if ((otpEntry.attempts || 0) >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    const isOtpValid = await bcrypt.compare(String(otp).trim(), otpEntry.otpHash);
    if (!isOtpValid) {
      await db.collection(COLLECTIONS.SIGNUP_OTPS).updateOne(
        { email: normalizedEmail },
        { $inc: { attempts: 1 }, $set: { updatedAt: new Date().toISOString() } }
      );
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const { id } = await createUser(
      normalizedEmail,
      otpEntry.passwordHash,
      otpEntry.username,
      otpEntry.fullName,
      true
    );
    const profile = await getProfileByUserId(id);
    const token = generateToken(id);

    await db.collection(COLLECTIONS.SIGNUP_OTPS).deleteOne({ email: normalizedEmail });

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
