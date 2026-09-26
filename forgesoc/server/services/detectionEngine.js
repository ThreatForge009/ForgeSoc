const DetectionRule = require('../models/DetectionRule');
const Event = require('../models/Event');
const Alert = require('../models/Alert');
const realtime = require('./realtime');
const { blockIp } = require('./blockService');
const { correlateAlert } = require('./correlationEngine');
const { runPlaybooks } = require('./playbookService');
const threatIntel = require('./threatIntelService');

let alertCounter = null;

const nextAlertId = async () => {
  if (alertCounter === null) {
    const count = await Alert.countDocuments();
    alertCounter = count;
  }
  alertCounter += 1;
  return `ALERT-${String(alertCounter).padStart(6, '0')}`;
};

/**
 * Evaluate a single incoming event against all enabled detection rules.
 * Rule-based, threshold-over-time-window logic (MVP). ML/AI scoring is a later phase.
 */
const evaluateEvent = async (event) => {
  const rules = await DetectionRule.find({ enabled: true });
  const triggered = [];

  for (const rule of rules) {
    const { condition } = rule;
    if (!condition) continue;
    if (condition.eventType && condition.eventType !== event.eventType) continue;
    if (condition.action && condition.action !== event.action) continue;
    // Match on a specific Windows Event ID when the rule specifies one (SIEM-style,
    // e.g. Sigma rules keying off EventID 4625 rather than a free-text action string)
    if (condition.windowsEventId && condition.windowsEventId !== event.windowsEventId) continue;

    const groupField = condition.groupBy || 'sourceIp';
    const groupValue = event[groupField];
    if (!groupValue) continue;

    const windowStart = new Date(Date.now() - (condition.windowMinutes || 5) * 60 * 1000);

    const matchFilter = {
      eventType: event.eventType,
      [groupField]: groupValue,
      timestamp: { $gte: windowStart },
    };
    if (condition.action) matchFilter.action = condition.action;
    if (condition.windowsEventId) matchFilter.windowsEventId = condition.windowsEventId;

    const count = await Event.countDocuments(matchFilter);

    if (count >= (condition.thresholdCount || 1)) {
      triggered.push({ rule, count, groupField, groupValue });
    }
  }

  const createdAlerts = [];
  for (const t of triggered) {
    const alert = await createAlertFromRule(t, event);
    if (alert) createdAlerts.push(alert);
  }

  return createdAlerts;
};

const createAlertFromRule = async ({ rule, count, groupField, groupValue }, event) => {
  // Avoid duplicate open alerts for the same rule + group value within the window
  const existing = await Alert.findOne({
    ruleId: rule._id,
    sourceIp: groupField === 'sourceIp' ? groupValue : event.sourceIp,
    status: { $in: ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING'] },
  });
  if (existing) return null;

  const alertId = await nextAlertId();

  const alert = await Alert.create({
    alertId,
    title: rule.name,
    description: `${rule.description || rule.name} — triggered by ${count} matching event(s) from ${groupValue}.${
      rule.mitre?.techniqueId ? ` [MITRE ${rule.mitre.techniqueId} — ${rule.mitre.techniqueName}]` : ''
    }`,
    severity: rule.severity,
    category: rule.category,
    sourceIp: event.sourceIp,
    destinationIp: event.destinationIp,
    hostname: event.hostname,
    username: event.username,
    ruleId: rule._id,
    relatedEvents: [event._id],
    status: 'OPEN',
  });

  const populatedAlert = await alert.populate('ruleId', 'name ruleCode mitre autoBlock correlationWeight');

  // Real-time push to every connected SOC dashboard
  realtime.emitNewAlert(populatedAlert);

  // Automated response: some rules (e.g. brute force, privilege escalation)
  // are configured to immediately block the offending source IP rather than
  // waiting on an analyst.
  if (rule.autoBlock && event.sourceIp && (rule.severity === 'CRITICAL' || rule.severity === 'HIGH')) {
    await blockIp({
      ip: event.sourceIp,
      reason: `Auto-blocked by detection rule ${rule.ruleCode} (${rule.name})`,
      autoBlocked: true,
      triggeredByRule: rule._id,
      triggeredByAlert: alert._id,
    });
  }

  // Cross-rule correlation: does this alert, combined with other recent alerts
  // from the same actor/host, indicate a multi-stage attack chain worth
  // escalating into an Incident?
  await correlateAlert(populatedAlert);

  // SOAR-style automated response — any playbook whose trigger matches this
  // alert's severity/category runs its configured actions (block, notify, assign).
  await runPlaybooks(populatedAlert);

  // Threat intel enrichment (non-blocking — don't hold up alert creation on a
  // third-party API call). No-ops silently if ABUSEIPDB_API_KEY isn't set.
  if (event.sourceIp && threatIntel.isConfigured()) {
    threatIntel
      .checkIp(event.sourceIp)
      .then((data) => data && Alert.findByIdAndUpdate(alert._id, { threatIntel: data }))
      .catch(() => {}); // best-effort; a failed lookup shouldn't affect the alert
  }

  return alert;
};

module.exports = { evaluateEvent };
