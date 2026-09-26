const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema(
  {
    hostname: { type: String, required: true, unique: true, trim: true },
    assetType: {
      type: String,
      enum: ['Windows Server', 'Linux Server', 'Windows Workstation', 'macOS', 'Network Device', 'Other'],
      default: 'Other',
    },
    ip: { type: String, required: true },
    os: { type: String },
    owner: { type: String },
    location: { type: String },
    status: { type: String, enum: ['ONLINE', 'OFFLINE', 'UNKNOWN'], default: 'UNKNOWN' },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    lastSeen: { type: Date, default: Date.now },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Asset', AssetSchema);
