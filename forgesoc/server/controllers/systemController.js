const firewall = require('../services/firewallService');
const syslogListener = require('../services/ingestion/syslogListener');
const { isConfigured: threatIntelConfigured } = require('../services/threatIntelService');
const { isConfigured: notificationsConfigured } = require('../services/notificationService');

// GET /api/system/status
exports.getStatus = async (req, res) => {
  res.json({
    firewall: firewall.status(),
    syslogIngestion: syslogListener.status(),
    threatIntel: threatIntelConfigured(),
    notifications: notificationsConfigured(),
  });
};
