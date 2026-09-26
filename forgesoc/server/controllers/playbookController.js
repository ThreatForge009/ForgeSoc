const Playbook = require('../models/Playbook');

// GET /api/playbooks
exports.getPlaybooks = async (req, res, next) => {
  try {
    const playbooks = await Playbook.find().sort({ createdAt: -1 });
    res.json(playbooks);
  } catch (err) {
    next(err);
  }
};

// POST /api/playbooks
exports.createPlaybook = async (req, res, next) => {
  try {
    const playbook = await Playbook.create(req.body);
    res.status(201).json(playbook);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/playbooks/:id
exports.updatePlaybook = async (req, res, next) => {
  try {
    const playbook = await Playbook.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!playbook) return res.status(404).json({ message: 'Playbook not found' });
    res.json(playbook);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/playbooks/:id/toggle
exports.toggle = async (req, res, next) => {
  try {
    const playbook = await Playbook.findById(req.params.id);
    if (!playbook) return res.status(404).json({ message: 'Playbook not found' });
    playbook.enabled = !playbook.enabled;
    await playbook.save();
    res.json(playbook);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/playbooks/:id
exports.deletePlaybook = async (req, res, next) => {
  try {
    const playbook = await Playbook.findByIdAndDelete(req.params.id);
    if (!playbook) return res.status(404).json({ message: 'Playbook not found' });
    res.json({ message: 'Playbook deleted' });
  } catch (err) {
    next(err);
  }
};
