const Playbook = require('../models/Playbook');
const User = require('../models/User');
const { blockIp } = require('./blockService');
const { notify } = require('./notificationService');
const Alert = require('../models/Alert');

/**
 * Runs every enabled playbook against a newly created alert. This is the
 * "SOAR" layer: detection rules decide *what happened*, playbooks decide
 * *what to do about it* — the same separation Wazuh's active-response or
 * Splunk SOAR's playbooks use, just far simpler.
 */
const runPlaybooks = async (alert) => {
  const playbooks = await Playbook.find({ enabled: true });
  const results = [];

  for (const pb of playbooks) {
    if (!matches(pb.trigger, alert)) continue;

    const actionResults = [];
    for (const action of pb.actions) {
      actionResults.push(await runAction(action, alert));
    }

    pb.lastRunAt = new Date();
    pb.runCount += 1;
    await pb.save();

    results.push({ playbook: pb.name, actions: actionResults });
  }

  return results;
};

const matches = (trigger, alert) => {
  if (trigger.severities?.length && !trigger.severities.includes(alert.severity)) return false;
  if (trigger.categories?.length && !trigger.categories.includes(alert.category)) return false;
  return true;
};

const runAction = async (action, alert) => {
  try {
    switch (action.type) {
      case 'BLOCK_IP': {
        if (!alert.sourceIp) return { type: action.type, skipped: 'no sourceIp on alert' };
        const entry = await blockIp({
          ip: alert.sourceIp,
          reason: `Playbook action — alert ${alert.alertId}`,
          autoBlocked: true,
          triggeredByAlert: alert._id,
        });
        return { type: action.type, ip: entry.ip };
      }
      case 'NOTIFY_SLACK':
      case 'NOTIFY_EMAIL': {
        const result = await notify({
          title: `[${alert.severity}] ${alert.title}`,
          body: `Alert ${alert.alertId} — ${alert.description}\nSource: ${alert.sourceIp || 'n/a'} · Host: ${alert.hostname || 'n/a'}`,
        });
        return { type: action.type, ...result };
      }
      case 'ASSIGN_ANALYST': {
        let userId = action.params?.userId;
        if (!userId && action.params?.role) {
          const candidate = await User.findOne({ role: action.params.role, isActive: true });
          userId = candidate?._id;
        }
        if (!userId) return { type: action.type, skipped: 'no matching analyst' };
        await Alert.findByIdAndUpdate(alert._id, { assignedTo: userId, status: 'ACKNOWLEDGED' });
        return { type: action.type, assignedTo: String(userId) };
      }
      default:
        return { type: action.type, skipped: 'unknown action type' };
    }
  } catch (err) {
    return { type: action.type, error: err.message };
  }
};

module.exports = { runPlaybooks };
