const axios = require('axios');

const sendNotification = async ({ recipient, role, title, message, type, relatedId }) => {
  try {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5008';
    console.log(`[Notification] Sending to ${notificationServiceUrl}/api/notifications/send:`, { recipient, role, title, type });
    
    const res = await axios.post(`${notificationServiceUrl}/api/notifications/send`, {
      userId: recipient,
      role: role,
      type,
      message: `${title}: ${message}`,
      relatedId
    }, {
      headers: {
        'x-internal-secret': process.env.INTERNAL_SECRET
      },
      timeout: 5000
    });
    
    console.log(`[Notification] Success:`, res.status, res.data?._id);
  } catch (err) {
    console.error('[Notification] FAILED:', err.response?.status, err.response?.data || err.message);
  }
};

module.exports = sendNotification;
