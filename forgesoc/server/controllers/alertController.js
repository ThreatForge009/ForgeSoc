const Alert = require('../models/Alert');

// GET /api/alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, severity, status, category, assignedTo, q } = req.query;

    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (q) {
      filter.$or = [
        { alertId: new RegExp(q, 'i') },
        { title: new RegExp(q, 'i') },
        { sourceIp: new RegExp(q, 'i') },
        { hostname: new RegExp(q, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('assignedTo', 'name title')
        .populate('ruleId', 'name ruleCode mitre'),
      Alert.countDocuments(filter),
    ]);

    res.json({ alerts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/:id  -- full investigation view
exports.getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('assignedTo', 'name title email')
      .populate('ruleId', 'name ruleCode description mitre autoBlock')
      .populate('relatedEvents')
      .populate('notes.author', 'name title');

    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/alerts/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'CLOSED'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const alert = await Alert.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/alerts/:id/assign
exports.assignAlert = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { assignedTo: userId, status: 'ACKNOWLEDGED' },
      { new: true }
    ).populate('assignedTo', 'name title');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/alerts/:id/verdict
exports.setVerdict = async (req, res, next) => {
  try {
    const { verdict } = req.body;
    const valid = ['UNDETERMINED', 'FALSE_POSITIVE', 'SUSPICIOUS', 'CONFIRMED_INCIDENT'];
    if (!valid.includes(verdict)) return res.status(400).json({ message: 'Invalid verdict' });

    const alert = await Alert.findByIdAndUpdate(req.params.id, { verdict }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    next(err);
  }
};

// POST /api/alerts/:id/notes
exports.addNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Note text is required' });

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { author: req.user._id, text } } },
      { new: true }
    ).populate('notes.author', 'name title');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/stats/summary
exports.getAlertStats = async (req, res, next) => {
  try {
    const [bySeverity, byStatus, byCategory, total, open] = await Promise.all([
      Alert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Alert.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Alert.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Alert.countDocuments(),
      Alert.countDocuments({ status: { $ne: 'CLOSED' } }),
    ]);
    res.json({ total, open, bySeverity, byStatus, byCategory });
  } catch (err) {
    next(err);
  }
};
