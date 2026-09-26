const DetectionRule = require('../models/DetectionRule');

// GET /api/rules
exports.getRules = async (req, res, next) => {
  try {
    const rules = await DetectionRule.find().sort({ createdAt: -1 });
    res.json(rules);
  } catch (err) {
    next(err);
  }
};

// GET /api/rules/:id
exports.getRuleById = async (req, res, next) => {
  try {
    const rule = await DetectionRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    next(err);
  }
};

// POST /api/rules
exports.createRule = async (req, res, next) => {
  try {
    const rule = await DetectionRule.create(req.body);
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rules/:id
exports.updateRule = async (req, res, next) => {
  try {
    const rule = await DetectionRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rules/:id/toggle
exports.toggleRule = async (req, res, next) => {
  try {
    const rule = await DetectionRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    rule.enabled = !rule.enabled;
    await rule.save();
    res.json(rule);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/rules/:id
exports.deleteRule = async (req, res, next) => {
  try {
    const rule = await DetectionRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    next(err);
  }
};
