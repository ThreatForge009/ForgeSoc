const Event = require('../models/Event');
const { processEvent } = require('../services/eventProcessor');

// GET /api/events  -- searchable / filterable event explorer
exports.getEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      eventType,
      sourceIp,
      destinationIp,
      hostname,
      username,
      protocol,
      from,
      to,
      q,
    } = req.query;

    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (sourceIp) filter.sourceIp = sourceIp;
    if (destinationIp) filter.destinationIp = destinationIp;
    if (hostname) filter.hostname = new RegExp(hostname, 'i');
    if (username) filter.username = new RegExp(username, 'i');
    if (protocol) filter.protocol = protocol;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }
    if (q) {
      filter.$or = [
        { eventId: new RegExp(q, 'i') },
        { action: new RegExp(q, 'i') },
        { hostname: new RegExp(q, 'i') },
        { sourceIp: new RegExp(q, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ events, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:id
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// POST /api/events  -- ingest a single event (used by synthetic generator / future ingestion agents)
exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    // Run through detection engine asynchronously-ish
    const result = await processEvent(event);
    res.status(201).json({ event, generatedAlert: result.alert || null });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/stats/summary  -- counts for dashboard charts
exports.getEventStats = async (req, res, next) => {
  try {
    const [byType, total, last24h] = await Promise.all([
      Event.aggregate([{ $group: { _id: '$eventType', count: { $sum: 1 } } }]),
      Event.countDocuments(),
      Event.countDocuments({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ]);
    res.json({ total, last24h, byType });
  } catch (err) {
    next(err);
  }
};
