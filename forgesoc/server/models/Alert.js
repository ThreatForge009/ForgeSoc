const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'],
      required: true,
      index: true,
    },
    category: { type: String }, // e.g. "Authentication", "Network", "Process"
    sourceIp: { type: String },
    destinationIp: { type: String },
    hostname: { type: String },
    username: { type: String },
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DetectionRule' },
    relatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    verdict: {
      type: String,
      enum: ['UNDETERMINED', 'FALSE_POSITIVE', 'SUSPICIOUS', 'CONFIRMED_INCIDENT'],
      default: 'UNDETERMINED',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // AbuseIPDB reputation snapshot for sourceIp, when threat intel is configured
    // (see services/threatIntelService.js) — null until/unless a lookup succeeds
    threatIntel: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);
