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
    const blocks = await db.collection(COLLECTIONS.BLOCKS)
      .find({
        $or: [
          { blocker_id: req.userId },
          { blocked_id: req.userId },
        ],
      })
      .toArray();

    const blockedByMe = new Set(
      blocks
        .filter((b) => b.blocker_id === req.userId)
        .map((b) => b.blocked_id)
    );
    const blockedMe = new Set(
      blocks
        .filter((b) => b.blocked_id === req.userId)
        .map((b) => b.blocker_id)
    );

    // Get all conversations where user is a participant
    const participants = await db.collection(COLLECTIONS.CONVERSATIONS)
      .aggregate([
        {
          $match: {
            'participants.user_id': req.userId,
            deleted_for: { $ne: req.userId },
          },
        },
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
      const otherParticipant = conv.participants.find((p) => p.user_id !== req.userId);
      const isDirect = !conv.is_group && otherParticipant?.user_id;
      const unreadCount = (conv.messages || []).filter(
        (m) => m.sender_id !== req.userId && new Date(m.created_at) > new Date(userParticipant?.last_read_at || 0)
      ).length;

      return {
        ...conv,
        last_message: conv.last_message ? formatDocument(conv.last_message) : undefined,
        unread_count: unreadCount,
        blocked_by_me: isDirect ? blockedByMe.has(otherParticipant.user_id) : false,
        blocked_me: isDirect ? blockedMe.has(otherParticipant.user_id) : false,
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
    if (conversation.created_by !== req.userId) {
      return res.status(403).json({ error: 'Only the group admin can add members' });
    }
    if (conversation.deleted_for && conversation.deleted_for.includes(req.userId)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get profiles for participants
    const userIds = conversation.participants.map((p) => p.user_id);
    const profiles = await db.collection(COLLECTIONS.PROFILES)
      .find({ user_id: { $in: userIds } })
      .toArray();

    const profileMap = new Map(profiles.map((p) => [p.user_id, formatDocument(p)]));
    const otherParticipant = conversation.participants.find((p) => p.user_id !== req.userId);
    const isDirect = !conversation.is_group && otherParticipant?.user_id;
    const block = isDirect
      ? await db.collection(COLLECTIONS.BLOCKS).findOne({
        $or: [
          { blocker_id: req.userId, blocked_id: otherParticipant.user_id },
          { blocker_id: otherParticipant.user_id, blocked_id: req.userId },
        ],
      })
      : null;

    const conversationWithDetails = {
      ...formatDocument(conversation),
      blocked_by_me: !!(isDirect && block && block.blocker_id === req.userId),
      blocked_me: !!(isDirect && block && block.blocker_id === otherParticipant?.user_id),
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
        await db.collection(COLLECTIONS.CONVERSATIONS).updateOne(
          { _id: existing._id },
          { $pull: { deleted_for: req.userId } }
        );

        // Return existing conversation
        const profiles = await db.collection(COLLECTIONS.PROFILES)
          .find({ user_id: { $in: [req.userId, participantId] } })
          .toArray();

        const profileMap = new Map(profiles.map((p) => [p.user_id, formatDocument(p)]));
        const existingOther = existing.participants.find((p) => p.user_id !== req.userId);
        const existingBlock = existingOther
          ? await db.collection(COLLECTIONS.BLOCKS).findOne({
            $or: [
              { blocker_id: req.userId, blocked_id: existingOther.user_id },
              { blocker_id: existingOther.user_id, blocked_id: req.userId },
            ],
          })
          : null;

        return res.json({
          ...formatDocument(existing),
          blocked_by_me: !!(existingBlock && existingBlock.blocker_id === req.userId),
          blocked_me: !!(existingBlock && existingBlock.blocker_id === existingOther?.user_id),
          participants: existing.participants.map((p) => ({
            ...p,
            id: p.id || new ObjectId().toString(),
            profile: profileMap.get(p.user_id) || null,
          })),
          unread_count: 0,
        });
      }

      // Check if users are blocked (only if no existing conversation)
      const block = await db.collection(COLLECTIONS.BLOCKS).findOne({
        $or: [
          { blocker_id: req.userId, blocked_id: participantId },
          { blocker_id: participantId, blocked_id: req.userId },
        ],
      });

      if (block) {
        return res.status(403).json({ error: 'Cannot start a conversation with this user' });
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
      request_status: isGroup ? 'active' : 'pending',
      requested_by: isGroup ? null : req.userId,
      requested_at: isGroup ? null : now,
      approved_at: isGroup ? now : null,
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
      blocked_by_me: false,
      blocked_me: false,
      participants: newConversation.participants.map((p) => ({
        ...p,
        id: p.id || new ObjectId().toString(),
        profile: profileMap.get(p.user_id) || null,
      })),
      unread_count: 0,
    });

    const io = req.app.get('io');
    if (io) {
      userIds.forEach((userId) => {
        io.to(`user:${userId}`).emit('conversation-created', {
          conversation_id: newConversation._id.toString(),
        });
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept a conversation request
router.post('/:conversationId/accept', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (conversation.created_by !== req.userId) {
      return res.status(403).json({ error: 'Only the group admin can remove members' });
    }

    if (conversation.is_group || conversation.request_status !== 'pending') {
      return res.status(400).json({ error: 'Conversation cannot be accepted' });
    }

    if (conversation.requested_by === req.userId) {
      return res.status(403).json({ error: 'Requester cannot accept their own request' });
    }

    const now = new Date().toISOString();

    await db.collection(COLLECTIONS.CONVERSATIONS).updateOne(
      { _id: new ObjectId(req.params.conversationId) },
      { $set: { request_status: 'active', approved_at: now, updated_at: now } }
    );

    const updated = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    const io = req.app.get('io');
    if (io && updated?.participants) {
      updated.participants.forEach((p) => {
        io.to(`user:${p.user_id}`).emit('conversation-updated', {
          conversation_id: updated._id.toString(),
        });
      });
    }

    res.json(formatDocument(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a conversation request (recipient only)
router.post('/:conversationId/delete-request', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const requestStatus = conversation.request_status ?? 'active';
    if (conversation.is_group || requestStatus === 'active') {
      return res.status(400).json({ error: 'Request cannot be deleted' });
    }

    if (conversation.requested_by === req.userId) {
      return res.status(403).json({ error: 'Requester cannot delete their own request' });
    }

    const deleteResult = await db.collection(COLLECTIONS.CONVERSATIONS).deleteOne({
      _id: new ObjectId(req.params.conversationId),
    });

    if (!deleteResult.deletedCount) {
      return res.status(400).json({ error: 'Request could not be deleted' });
    }

    await db.collection(COLLECTIONS.MESSAGES).deleteMany({
      conversation_id: req.params.conversationId,
    });

    const io = req.app.get('io');
    if (io && conversation?.participants) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.user_id}`).emit('conversation-deleted', {
          conversation_id: req.params.conversationId,
        });
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete conversation for current user
router.delete('/:conversationId', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date().toISOString();
    await db.collection(COLLECTIONS.CONVERSATIONS).updateOne(
      { _id: new ObjectId(req.params.conversationId) },
      { $addToSet: { deleted_for: req.userId }, $set: { updated_at: now } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.userId}`).emit('conversation-deleted', {
        conversation_id: req.params.conversationId,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a user to a group conversation
router.post('/:conversationId/participants', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.is_group) {
      return res.status(400).json({ error: 'Only group conversations support participants' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date().toISOString();
    await db.collection(COLLECTIONS.CONVERSATIONS).updateOne(
      { _id: new ObjectId(req.params.conversationId) },
      {
        $addToSet: {
          participants: {
            user_id: userId,
            joined_at: now,
            last_read_at: now,
          },
        },
        $set: { updated_at: now },
      }
    );

    const updated = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    const userIds = updated.participants.map((p) => p.user_id);
    const profiles = await db.collection(COLLECTIONS.PROFILES)
      .find({ user_id: { $in: userIds } })
      .toArray();
    const profileMap = new Map(profiles.map((p) => [p.user_id, formatDocument(p)]));

    const io = req.app.get('io');
    if (io) {
      userIds.forEach((uid) => {
        io.to(`user:${uid}`).emit('conversation-updated', {
          conversation_id: updated._id.toString(),
        });
      });
      io.to(`user:${userId}`).emit('conversation-created', {
        conversation_id: updated._id.toString(),
      });
    }

    res.json({
      ...formatDocument(updated),
      participants: updated.participants.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id) || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a user from a group conversation
router.delete('/:conversationId/participants/:userId', authenticate, async (req, res) => {
  try {
    const db = getDb();

    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.is_group) {
      return res.status(400).json({ error: 'Only group conversations support participants' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date().toISOString();
    await db.collection(COLLECTIONS.CONVERSATIONS).updateOne(
      { _id: new ObjectId(req.params.conversationId) },
      {
        $pull: { participants: { user_id: req.params.userId } },
        $set: { updated_at: now },
      }
    );

    const updated = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    const userIds = updated.participants.map((p) => p.user_id);
    const profiles = await db.collection(COLLECTIONS.PROFILES)
      .find({ user_id: { $in: userIds } })
      .toArray();
    const profileMap = new Map(profiles.map((p) => [p.user_id, formatDocument(p)]));

    const io = req.app.get('io');
    if (io) {
      userIds.forEach((uid) => {
        io.to(`user:${uid}`).emit('conversation-updated', {
          conversation_id: updated._id.toString(),
        });
      });
      io.to(`user:${req.params.userId}`).emit('conversation-deleted', {
        conversation_id: updated._id.toString(),
      });
    }

    res.json({
      ...formatDocument(updated),
      participants: updated.participants.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id) || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Block a user in a direct conversation
router.post('/:conversationId/block', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.is_group) {
      return res.status(400).json({ error: 'Blocking is only supported for direct conversations' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const otherParticipant = conversation.participants.find((p) => p.user_id !== req.userId);
    if (!otherParticipant) {
      return res.status(400).json({ error: 'Invalid conversation participants' });
    }

    const now = new Date().toISOString();

    await db.collection(COLLECTIONS.BLOCKS).updateOne(
      { blocker_id: req.userId, blocked_id: otherParticipant.user_id },
      { $setOnInsert: { blocker_id: req.userId, blocked_id: otherParticipant.user_id, created_at: now } },
      { upsert: true }
    );

    const io = req.app.get('io');
    if (io) {
      [req.userId, otherParticipant.user_id].forEach((userId) => {
        io.to(`user:${userId}`).emit('conversation-updated', {
          conversation_id: req.params.conversationId,
        });
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unblock a user in a direct conversation
router.post('/:conversationId/unblock', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const conversation = await db.collection(COLLECTIONS.CONVERSATIONS)
      .findOne({ _id: new ObjectId(req.params.conversationId) });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.is_group) {
      return res.status(400).json({ error: 'Unblocking is only supported for direct conversations' });
    }

    const isParticipant = conversation.participants?.some((p) => p.user_id === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const otherParticipant = conversation.participants.find((p) => p.user_id !== req.userId);
    if (!otherParticipant) {
      return res.status(400).json({ error: 'Invalid conversation participants' });
    }

    await db.collection(COLLECTIONS.BLOCKS).deleteOne({
      blocker_id: req.userId,
      blocked_id: otherParticipant.user_id,
    });

    const io = req.app.get('io');
    if (io) {
      [req.userId, otherParticipant.user_id].forEach((userId) => {
        io.to(`user:${userId}`).emit('conversation-updated', {
          conversation_id: req.params.conversationId,
        });
      });
    }

    res.json({ success: true });
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
