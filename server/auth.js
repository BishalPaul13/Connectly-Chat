import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, COLLECTIONS } from './db.js';
import { formatDocument } from './models.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createUser(email, password, username, fullName, isPasswordHashed = false) {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  
  // Check if user already exists
  const existingUser = await db.collection(COLLECTIONS.USERS).findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const existingProfile = await db.collection(COLLECTIONS.PROFILES).findOne({ username });
  if (existingProfile) {
    throw new Error('Username already taken');
  }

  const hashedPassword = isPasswordHashed ? password : await hashPassword(password);
  const now = new Date().toISOString();

  // Create user
  const userResult = await db.collection(COLLECTIONS.USERS).insertOne({
    email: normalizedEmail,
    password: hashedPassword,
    created_at: now,
    updated_at: now,
  });

  const userId = userResult.insertedId.toString();

  // Create profile
  await db.collection(COLLECTIONS.PROFILES).insertOne({
    user_id: userId,
    username,
    full_name: fullName || null,
    avatar_url: null,
    status: 'Hey, I am using ChatApp!',
    is_online: false,
    last_seen: now,
    created_at: now,
    updated_at: now,
  });

  return { id: userId, email: normalizedEmail };
}

export async function authenticateUser(email, password) {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  
  const user = await db.collection(COLLECTIONS.USERS).findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const profile = await db.collection(COLLECTIONS.PROFILES).findOne({ user_id: user._id.toString() });
  
  return {
    user: formatDocument(user),
    profile: formatDocument(profile),
  };
}

export async function getUserById(userId) {
  const db = getDb();
  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: userId });
  return formatDocument(user);
}

export async function getUserByEmail(email) {
  const db = getDb();
  const user = await db.collection(COLLECTIONS.USERS).findOne({ email: email.trim().toLowerCase() });
  return formatDocument(user);
}

export async function getProfileByUserId(userId) {
  const db = getDb();
  const profile = await db.collection(COLLECTIONS.PROFILES).findOne({ user_id: userId });
  return formatDocument(profile);
}
