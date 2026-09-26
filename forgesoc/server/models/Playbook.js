const mongoose = require('mongoose');

const PlaybookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: true },

    // Trigger condition — matched against a newly created alert
    trigger: {
      severities: [{ type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] }],
      categories: [{ type: String }], // empty = any category
    },

    // Ordered list of actions to run when the trigger matches
    actions: [
      {
        type: {
          type: String,
          enum: ['BLOCK_IP', 'NOTIFY_SLACK', 'NOTIFY_EMAIL', 'ASSIGN_ANALYST'],
          required: true,
        },
        params: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],

    // Execution log for the most recent runs (kept short — not a full audit trail)
    lastRunAt: { type: Date },
    runCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Playbook', PlaybookSchema);
