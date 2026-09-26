const BlockedIP = require('../models/BlockedIP');
const realtime = require('./realtime');
const firewall = require('./firewallService');

/**
 * Block an IP. Used both by analysts (manual, via API) and by the detection
 * engine (automatic, when a rule with autoBlock=true fires).
 * Idempotent: re-blocking an already-active IP just refreshes the reason/expiry.
 */
const blockIp = async ({ ip, reason, autoBlocked = false, triggeredByRule = null, triggeredByAlert = null, blockedBy = null, expiresAt = null }) => {
  let entry = await BlockedIP.findOne({ ip });

  if (entry && entry.active) {
    // Already blocked — just log the additional trigger, don't duplicate.
    return entry;
  }

  // Enforce at the OS firewall level (real if ENABLE_REAL_FIREWALL=true, else dry-run/logged only)
  const enforcement = await firewall.applyBlock(ip);

  if (entry) {
    entry.active = true;
    entry.reason = reason;
    entry.autoBlocked = autoBlocked;
    entry.triggeredByRule = triggeredByRule;
    entry.triggeredByAlert = triggeredByAlert;
    entry.blockedBy = blockedBy;
    entry.expiresAt = expiresAt;
    entry.unblockedAt = null;
    entry.enforcement = enforcement;
    await entry.save();
  } else {
    entry = await BlockedIP.create({
      ip,
      reason,
      autoBlocked,
      triggeredByRule,
      triggeredByAlert,
      blockedBy,
      expiresAt,
      enforcement,
    });
  }

  const populated = await entry.populate([
    { path: 'triggeredByRule', select: 'name ruleCode' },
    { path: 'blockedBy', select: 'name' },
  ]);

  realtime.emitIpBlocked(populated);
  return populated;
};

const unblockIp = async (id, userId = null) => {
  const entry = await BlockedIP.findById(id);
  if (!entry) return null;

  await firewall.removeBlock(entry.ip);

  entry.active = false;
  entry.unblockedAt = new Date();
  await entry.save();

  realtime.emitIpUnblocked(entry);
  return entry;
};

const isBlocked = async (ip) => {
  const entry = await BlockedIP.findOne({ ip, active: true });
  return !!entry;
};

module.exports = { blockIp, unblockIp, isBlocked };
