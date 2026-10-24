const Notification = require('../models/Notification');

// @desc    Get user's notifications (or admin's notifications)
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const query = req.user.role === 'admin' 
      ? { $or: [{ role: 'admin' }, { recipient: userId }] }
      : { recipient: userId };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
      
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    
    // Verify ownership or admin
    const isOwner = notification.recipient && notification.recipient.toString() === userId;
    const isAdminNotification = notification.role === 'admin' && req.user.role === 'admin';
    
    if (!isOwner && !isAdminNotification) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const query = req.user.role === 'admin' 
      ? { $or: [{ role: 'admin' }, { recipient: userId }], isRead: false }
      : { recipient: userId, isRead: false };

    await Notification.updateMany(query, { $set: { isRead: true } });

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create notification (Internal API)
// @route   POST /api/notifications/internal
// @access  Internal Network Only
exports.createInternalNotification = async (req, res) => {
  try {
    // Basic security check for internal API
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== (process.env.INTERNAL_SECRET || 'internal_super_secret_key_123')) {
      return res.status(401).json({ message: 'Unauthorized internal access' });
    }

    const { recipient, role, title, message, type, relatedId } = req.body;

    const notification = new Notification({
      recipient: recipient || null,
      role: role || 'user',
      title,
      message,
      type: type || 'info',
      relatedId: relatedId || ''
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    console.error('Create internal notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
