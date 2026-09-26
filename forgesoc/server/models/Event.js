const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now, index: true },
    source: { type: String }, // e.g. Windows-Security, Syslog, Firewall
    hostname: { type: String, index: true },
    sourceIp: { type: String, index: true },
    destinationIp: { type: String },
    eventType: {
      type: String,
      enum: ['AUTH', 'NETWORK', 'PROCESS', 'FILE', 'SYSTEM', 'PRIVILEGE'],
      required: true,
      index: true,
    },
    // Windows Security Event ID (e.g. 4625 = failed logon, 4688 = process creation).
    // Populated for Windows-sourced events; null/omitted for syslog/firewall/EDR sources
    // that don't use this numbering scheme.
    windowsEventId: { type: Number, index: true },
    action: { type: String }, // e.g. "login_failed", "connection_established"
    username: { type: String },
    protocol: { type: String },
    port: { type: Number },
    severityHint: { type: String, enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'INFO' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

EventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema);
