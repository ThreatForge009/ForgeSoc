const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const realtime = require('./realtime');

const CORRELATION_WINDOW_MINUTES = 15;
const SCORE_THRESHOLD_FOR_INCIDENT = 3; // sum of correlationWeight across distinct rules

let incidentCounter = null;
const nextIncidentId = async () => {
  if (incidentCounter === null) incidentCounter = await Incident.countDocuments();
  incidentCounter += 1;
  return `INCIDENT-${String(incidentCounter).padStart(4, '0')}`;
};

/**
 * After a new alert is created, look for other recent alerts sharing the same
 * source IP or hostname (an attack chain: e.g. recon -> brute force -> privilege
 * escalation from one actor). If the combined weight crosses the threshold and
 * no open incident already covers this group, auto-create one.
 *
 * Deliberately simple — group-by-pivot + weighted scoring — as a readable
 * stand-in for the correlation rules a full SIEM (Wazuh, Sentinel) would run.
 */
const correlateAlert = async (newAlert) => {
  if (!newAlert.sourceIp && !newAlert.hostname) return null;

  const windowStart = new Date(Date.now() - CORRELATION_WINDOW_MINUTES * 60 * 1000);

  const pivotFilter = {
    _id: { $ne: newAlert._id },
    createdAt: { $gte: windowStart },
    status: { $ne: 'CLOSED' },
    $or: [
      newAlert.sourceIp ? { sourceIp: newAlert.sourceIp } : null,
      newAlert.hostname ? { hostname: newAlert.hostname } : null,
    ].filter(Boolean),
  };

  const relatedAlerts = await Alert.find(pivotFilter).populate('ruleId', 'correlationWeight name');
  if (relatedAlerts.length === 0) return null;

  const group = [newAlert, ...relatedAlerts];
  const distinctRules = new Set(group.map((a) => String(a.ruleId?._id || a.ruleId || '')));

  // Require at least 2 distinct detection rules — a single rule re-triggering
  // repeatedly is noise, not a multi-stage attack chain.
  if (distinctRules.size < 2) return null;

  const score = group.reduce((sum, a) => sum + (a.ruleId?.correlationWeight || 1), 0);
  if (score < SCORE_THRESHOLD_FOR_INCIDENT) return null;

  // Don't double-create: check if an open incident already links any of these alerts.
  const existingIncident = await Incident.findOne({
    relatedAlerts: { $in: group.map((a) => a._id) },
    status: { $ne: 'CLOSED' },
  });
  if (existingIncident) {
    const newlyLinked = group
      .map((a) => a._id)
      .filter((id) => !existingIncident.relatedAlerts.some((r) => String(r) === String(id)));
    if (newlyLinked.length) {
      existingIncident.relatedAlerts.push(...newlyLinked);
      await existingIncident.save();
    }
    return existingIncident;
  }

  const pivot = newAlert.sourceIp || newAlert.hostname;
  const incidentId = await nextIncidentId();
  const incident = await Incident.create({
    incidentId,
    title: `Correlated multi-stage activity from ${pivot}`,
    description: `Auto-correlated ${group.length} alerts across ${distinctRules.size} detection rules within ${CORRELATION_WINDOW_MINUTES} minutes (correlation score ${score}).`,
    severity: group.some((a) => a.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
    status: 'NEW',
    relatedAlerts: group.map((a) => a._id),
  });

  realtime.emitIncidentCreated(incident);
  return incident;
};

module.exports = { correlateAlert };
