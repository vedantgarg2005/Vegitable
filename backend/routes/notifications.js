const express = require('express');
const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');
const User = require('../models/User');
const router = express.Router();
const expo = new Expo();

// Send push notification
const sendPushNotification = async (userId, title, message, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.deviceTokens.length) return;

    const notification = await new Notification({
      user: userId,
      title,
      message,
      type: data.type || 'general',
      data
    }).save();

    const messages = user.deviceTokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => ({ to: token, title, body: message, data, sound: 'default' }));

    if (messages.length) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    }

    return notification;
  } catch (error) {
    console.error('Push notification error:', error);
  }
};

// Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send order update notification
router.post('/order-update', async (req, res) => {
  try {
    const { userId, orderId, status, message } = req.body;
    
    await sendPushNotification(userId, 'Order Update', message, {
      type: 'order_update',
      orderId,
      status
    });
    
    res.json({ message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.sendPushNotification = sendPushNotification;