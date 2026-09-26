const mongoose = require('mongoose');

const BlockedIPSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, unique: true, index: true },
    reason: { type: String, required: true },
    active: { type: Boolean, default: true },
    autoBlocked: { type: Boolean, default: false }, // true = triggered by detection engine, false = manual analyst action
    triggeredByRule: { type: mongoose.Schema.Types.ObjectId, ref: 'DetectionRule' },
    triggeredByAlert: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for auto-blocks
    expiresAt: { type: Date }, // null = indefinite
    unblockedAt: { type: Date },
    // What actually happened at the OS/firewall level when this block was applied
    // (see services/firewallService.js) — { applied, mode: 'real'|'dry-run', command }
    enforcement: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlockedIP', BlockedIPSchema);
