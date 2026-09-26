const mongoose = require('mongoose');

const DetectionRuleSchema = new mongoose.Schema(
  {
    ruleCode: { type: String, required: true, unique: true }, // e.g. BRUTE_FORCE_001
    name: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: [
        'Multiple Failed Logins',
        'Suspicious Process',
        'Unusual Network Connection',
        'Privilege Change',
        'Port Scan Detection',
        'Abnormal Authentication',
        'Other',
      ],
      default: 'Other',
    },
    // Simple declarative condition the detection engine evaluates
    condition: {
      eventType: { type: String }, // AUTH, NETWORK, PROCESS, etc.
      action: { type: String }, // e.g. login_failed
      windowsEventId: { type: Number }, // optional: match a specific Windows Event ID directly
      thresholdCount: { type: Number, default: 1 },
      windowMinutes: { type: Number, default: 5 },
      groupBy: { type: String, default: 'sourceIp' }, // field to group repeated events by
    },
    severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'], default: 'MEDIUM' },
    enabled: { type: Boolean, default: true },

    // MITRE ATT&CK mapping, shown in the alert investigation view (SIEM-style context)
    mitre: {
      tactic: { type: String },     // e.g. "Credential Access"
      techniqueId: { type: String }, // e.g. "T1110"
      techniqueName: { type: String }, // e.g. "Brute Force"
    },

    // When true, a triggered CRITICAL/HIGH alert automatically adds the source IP
    // to the real-time blocklist (see BlockedIP model + services/blockService.js)
    autoBlock: { type: Boolean, default: false },

    // Weight this rule contributes to cross-rule correlation scoring (see correlationEngine.js)
    correlationWeight: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DetectionRule', DetectionRuleSchema);
