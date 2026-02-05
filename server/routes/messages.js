import express from 'express';
import { verifyToken } from '../auth.js';
import { getDb, COLLECTIONS } from '../db.js';
import { formatDocument, formatDocuments } from '../models.js';
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

// Get messages for a conversation
router.get('/conversation/:conversationId', authenticate, async (req, res) => {
  try {
    const db = getDb();
    
    // Verify user is a participant
    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const messages = await db.collection(COLLECTIONS.MESSAGES)
      .find({ conversation_id: req.params.conversationId })
      .sort({ created_at: 1 })
      .toArray();

    res.json(formatDocuments(messages));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { conversation_id, content } = req.body;

    if (!conversation_id || !content) {
      return res.status(400).json({ error: 'conversation_id and content are required' });
    }

    // Verify user is a participant
    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(conversation_id) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (conversation.deleted_for && conversation.deleted_for.includes(req.userId)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.deleted_for && conversation.deleted_for.includes(req.userId)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.is_group) {
      const requestStatus = conversation.request_status ?? 'active';
      if (requestStatus !== 'active') {
        return res.status(403).json({ error: 'Conversation request not accepted yet' });
      }

      const otherParticipant = conversation.participants.find((p) => p.user_id !== req.userId);
      if (otherParticipant) {
        const block = await db.collection(COLLECTIONS.BLOCKS).findOne({
          $or: [
            { blocker_id: req.userId, blocked_id: otherParticipant.user_id },
            { blocker_id: otherParticipant.user_id, blocked_id: req.userId },
          ],
        });

        if (block) {
          return res.status(403).json({ error: 'Messaging is blocked for this conversation' });
        }
      }
    }

    const now = new Date().toISOString();
    const message = {
      conversation_id,
      sender_id: req.userId,
      content: content.trim(),
      message_type: 'text',
      status: 'sent',
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection(COLLECTIONS.MESSAGES).insertOne(message);
    const newMessage = await db.collection(COLLECTIONS.MESSAGES)
      .findOne({ _id: result.insertedId });

    // Update conversation updated_at
    await db.collection(COLLECTIONS.CONVERSATIONS).updateOne(
      { _id: new ObjectId(conversation_id) },
      { $set: { updated_at: now } }
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversation_id}`).emit('new-message', formatDocument(newMessage));
    }

    res.json(formatDocument(newMessage));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
