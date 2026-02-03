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

// Get all conversations for the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();

    // Get all conversations where user is a participant
    const participants = await db.collection(COLLECTIONS.CONVERSATIONS)
      .aggregate([
        { $match: { 'participants.user_id': req.userId } },
        {
          $lookup: {
            from: COLLECTIONS.MESSAGES,
            let: { convIdStr: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$conversation_id', '$$convIdStr'] } } },
              { $sort: { created_at: 1 } }
            ],
            as: 'messages',
          },
        },
        {
          $lookup: {
            from: COLLECTIONS.PROFILES,
            localField: 'participants.user_id',
            foreignField: 'user_id',
            as: 'profiles',
          },
        },
        {
          $addFields: {
            last_message: { $arrayElemAt: [{ $slice: ['$messages', -1] }, 0] },
            participants: {
              $map: {
                input: '$participants',
                as: 'participant',
                in: {
                  $mergeObjects: [
                    '$$participant',
                    {
                      profile: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$profiles',
                              cond: { $eq: ['$$this.user_id', '$$participant.user_id'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $sort: { updated_at: -1 } },
      ])
      .toArray();

    const conversations = formatDocuments(participants).map((conv) => {
      const userParticipant = conv.participants.find((p) => p.user_id === req.userId);
      const unreadCount = (conv.messages || []).filter(
        (m) => m.sender_id !== req.userId && new Date(m.created_at) > new Date(userParticipant?.last_read_at || 0)
      ).length;

      return {
        ...conv,
        last_message: conv.last_message ? formatDocument(conv.last_message) : undefined,
        unread_count: unreadCount,
        participants: conv.participants.map((p) => ({
          ...p,
          profile: p.profile ? formatDocument(p.profile) : null,
        })),
      };
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single conversation
router.get('/:conversationId', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get profiles for participants
    const userIds = conversation.participants.map((p) => p.user_id);
    const profiles = await db.collection(COLLECTIONS.PROFILES)
      .find({ user_id: { $in: userIds } })
      .toArray();

    const profileMap = new Map(profiles.map((p) => [p.user_id, formatDocument(p)]));

    const conversationWithDetails = {
      ...formatDocument(conversation),
      participants: conversation.participants.map((p) => ({
        ...p,
        id: p.id || new ObjectId().toString(),
        profile: profileMap.get(p.user_id) || null,
      })),
    };

    res.json(conversationWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new conversation
router.post('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { participantId, isGroup, name, participantIds } = req.body;

    const now = new Date().toISOString();
    const participants = [];

    if (isGroup) {
      // Group conversation
      const allParticipants = [...new Set([req.userId, ...(participantIds || [])])];
      participants.push(...allParticipants.map((userId) => ({
        user_id: userId,
        joined_at: now,
        last_read_at: now,
      })));
    } else {
      // Direct conversation - check if one already exists
      const existing = await db.collection(COLLECTIONS.CONVERSATIONS).findOne({
        is_group: false,
        'participants.user_id': { $all: [req.userId, participantId] },
        'participants.0': { $exists: true },
      });

      if (existing) {
        // Return existing conversation
        const profiles = await db.collection(COLLECTIONS.PROFILES)
          .find({ user_id: { $in: [req.userId, participantId] } })
          .toArray();

        const profileMap = new Map(profiles.map((p) => [p.user_id, formatDocument(p)]));

        return res.json({
          ...formatDocument(existing),
          participants: existing.participants.map((p) => ({
            ...p,
            id: p.id || new ObjectId().toString(),
            profile: profileMap.get(p.user_id) || null,
          })),
          unread_count: 0,
        });
      }

      // Create new direct conversation
      participants.push(
        { user_id: req.userId, joined_at: now, last_read_at: now },
        { user_id: participantId, joined_at: now, last_read_at: now }
      );
    }

    const conversation = {
      name: name || null,
      is_group: isGroup || false,
      avatar_url: null,
      created_by: req.userId,
      participants,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection(COLLECTIONS.CONVERSATIONS).insertOne(conversation);
    const newConversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: result.insertedId });

    // Get profiles
    const userIds = participants.map((p) => p.user_id);
    const profiles = await db.collection(COLLECTIONS.PROFILES)
      .find({ user_id: { $in: userIds } })
      .toArray();

    const profileMap = new Map(profiles.map((p) => [p.user_id, formatDocument(p)]));

    res.json({
      ...formatDocument(newConversation),
      participants: newConversation.participants.map((p) => ({
        ...p,
        id: p.id || new ObjectId().toString(),
        profile: profileMap.get(p.user_id) || null,
      })),
      unread_count: 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark conversation as read
router.patch('/:conversationId/read', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    await db.collection(COLLECTIONS.CONVERSATIONS).updateOne(
      {
        _id: new ObjectId(req.params.conversationId),
        'participants.user_id': req.userId,
      },
      {
        $set: {
          'participants.$.last_read_at': now,
          updated_at: now,
        },
      }
    );

    // Update message statuses
    const updateResult = await db.collection(COLLECTIONS.MESSAGES).updateMany(
      {
        conversation_id: req.params.conversationId,
        sender_id: { $ne: req.userId },
      },
      {
        $set: { status: 'read' },
      }
    );

    // Emit socket event for read status update if messages were updated
    if (updateResult.modifiedCount > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation:${req.params.conversationId}`).emit('message-read', {
          conversation_id: req.params.conversationId,
          reader_id: req.userId,
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
