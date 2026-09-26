const Incident = require('../models/Incident');

// GET /api/incidents
exports.getIncidents = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const incidents = await Incident.find(filter)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name title')
      .populate('relatedAlerts', 'alertId title severity');
    res.json(incidents);
  } catch (err) {
    next(err);
  }
};

// GET /api/incidents/:id
exports.getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('assignedTo', 'name title')
      .populate('relatedAlerts');
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    next(err);
  }
};

// POST /api/incidents
exports.createIncident = async (req, res, next) => {
  try {
    const count = await Incident.countDocuments();
    const incidentId = `INCIDENT-${String(count + 1).padStart(4, '0')}`;
    const incident = await Incident.create({ ...req.body, incidentId });
    res.status(201).json(incident);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/incidents/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['NEW', 'TRIAGED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const incident = await Incident.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    next(err);
  }
};
