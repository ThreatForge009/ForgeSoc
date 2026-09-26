const BlockedIP = require('../models/BlockedIP');
const { blockIp, unblockIp } = require('../services/blockService');

// GET /api/blocklist
exports.getBlocklist = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) filter.active = active === 'true';

    const entries = await BlockedIP.find(filter)
      .sort({ createdAt: -1 })
      .populate('triggeredByRule', 'name ruleCode')
      .populate('blockedBy', 'name');
    res.json(entries);
  } catch (err) {
    next(err);
  }
};

// POST /api/blocklist  -- manual block by an analyst
exports.createBlock = async (req, res, next) => {
  try {
    const { ip, reason, expiresAt } = req.body;
    if (!ip || !reason) return res.status(400).json({ message: 'ip and reason are required' });

    const entry = await blockIp({
      ip,
      reason,
      autoBlocked: false,
      blockedBy: req.user._id,
      expiresAt: expiresAt || null,
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/blocklist/:id/unblock
exports.removeBlock = async (req, res, next) => {
  try {
    const entry = await unblockIp(req.params.id, req.user._id);
    if (!entry) return res.status(404).json({ message: 'Blocklist entry not found' });
    res.json(entry);
  } catch (err) {
    next(err);
  }
};
