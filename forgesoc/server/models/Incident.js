const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema(
  {
    incidentId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    status: {
      type: String,
      enum: ['NEW', 'TRIAGED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'],
      default: 'NEW',
    },
    relatedAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', IncidentSchema);
