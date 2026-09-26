const { evaluateEvent } = require('./detectionEngine');
const { isBlocked } = require('./blockService');
const realtime = require('./realtime');

/**
 * Called after an event is persisted. Pushes it to any connected dashboards
 * in real time, flags whether it came from a currently-blocked source (so the
 * UI can show "would have been dropped at the firewall"), then runs it
 * through the detection engine and returns any alert(s) generated.
 */
const processEvent = async (event) => {
  if (event.sourceIp && (await isBlocked(event.sourceIp))) {
    event.metadata = { ...(event.metadata || {}), blockedSourceTraffic: true };
    await event.save();
  }

  realtime.emitNewEvent(event);

  const alerts = await evaluateEvent(event);
  return { alert: alerts[0] || null, alerts };
};

module.exports = { processEvent };
