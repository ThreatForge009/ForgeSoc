const Alert = require('../models/Alert');
const Event = require('../models/Event');

const toCsv = (rows, columns) => {
  const header = columns.join(',');
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return /[,"\n]/.test(str) ? `"${str}"` : str;
  };
  const lines = rows.map((row) => columns.map((c) => escape(row[c])).join(','));
  return [header, ...lines].join('\n');
};

// GET /api/reports/alerts.csv?from=&to=&severity=
exports.exportAlertsCsv = async (req, res, next) => {
  try {
    const { from, to, severity } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).lean();
    const rows = alerts.map((a) => ({
      alertId: a.alertId,
      title: a.title,
      severity: a.severity,
      category: a.category,
      status: a.status,
      verdict: a.verdict,
      sourceIp: a.sourceIp,
      hostname: a.hostname,
      username: a.username,
      createdAt: a.createdAt.toISOString(),
    }));

    const csv = toCsv(rows, [
      'alertId', 'title', 'severity', 'category', 'status', 'verdict', 'sourceIp', 'hostname', 'username', 'createdAt',
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="forgesoc-alerts-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/events.csv?from=&to=&eventType=
exports.exportEventsCsv = async (req, res, next) => {
  try {
    const { from, to, eventType } = req.query;
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const events = await Event.find(filter).sort({ timestamp: -1 }).limit(50000).lean();
    const rows = events.map((e) => ({
      eventId: e.eventId,
      timestamp: e.timestamp.toISOString(),
      hostname: e.hostname,
      sourceIp: e.sourceIp,
      eventType: e.eventType,
      windowsEventId: e.windowsEventId,
      action: e.action,
      username: e.username,
    }));

    const csv = toCsv(rows, [
      'eventId', 'timestamp', 'hostname', 'sourceIp', 'eventType', 'windowsEventId', 'action', 'username',
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="forgesoc-events-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/summary  -- JSON summary for a period (used by the Reports page)
exports.getSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const alertFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
    const eventFilter = Object.keys(dateFilter).length ? { timestamp: dateFilter } : {};

    const [totalEvents, totalAlerts, bySeverity, byStatus] = await Promise.all([
      Event.countDocuments(eventFilter),
      Alert.countDocuments(alertFilter),
      Alert.aggregate([{ $match: alertFilter }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Alert.aggregate([{ $match: alertFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.json({ totalEvents, totalAlerts, bySeverity, byStatus, period: { from: from || null, to: to || null } });
  } catch (err) {
    next(err);
  }
};
