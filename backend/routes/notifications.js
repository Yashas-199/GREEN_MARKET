const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user notifications
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify access
    if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [notifications] = await db.query(
      `SELECT * FROM Notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/user/:userId/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify access
    if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ unreadCount: result[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const userId = req.user.userId;

    // Verify ownership
    const [notifications] = await db.query(
      'SELECT * FROM Notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query(
      'UPDATE Notifications SET is_read = TRUE WHERE notification_id = ?',
      [notificationId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.put('/user/:userId/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify access
    if (req.user.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query(
      'UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Delete notification
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const userId = req.user.userId;

    // Verify ownership
    const [notifications] = await db.query(
      'SELECT * FROM Notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM Notifications WHERE notification_id = ?', [notificationId]);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;