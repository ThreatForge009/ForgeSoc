const dgram = require('dgram');
const Event = require('../../models/Event');
const { processEvent } = require('../eventProcessor');

const PORT = Number(process.env.SYSLOG_UDP_PORT || 1514); // 1514, not 514 — no root required
let server = null;
let received = 0;
let lastReceivedAt = null;

let eventCounter = null;
const nextEventId = async () => {
  if (eventCounter === null) eventCounter = await Event.countDocuments();
  eventCounter += 1;
  return `EVT-SYS-${String(eventCounter)}`;
};

// Very small, permissive syslog parser: handles both RFC 3164
// ("<134>Sep 24 10:00:00 host app: message") and plain free-text lines from
// devices that don't bother with a strict format (most consumer firewalls,
// many IoT devices, some Linux daemons piping straight to a syslog forwarder).
const parseSyslogLine = (raw, remoteAddress) => {
  const priMatch = raw.match(/^<(\d+)>/);
  const pri = priMatch ? Number(priMatch[1]) : null;
  const rest = priMatch ? raw.slice(priMatch[0].length) : raw;

  const headerMatch = rest.match(/^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:]+):\s*(.*)$/);

  let hostname = remoteAddress;
  let appName = 'syslog';
  let message = rest.trim();

  if (headerMatch) {
    hostname = headerMatch[2];
    appName = headerMatch[3];
    message = headerMatch[4];
  }

  // Rough severity from the syslog PRI field (facility*8 + severity); 0-3 = emerg/alert/crit/err
  const severity = pri !== null ? pri % 8 : 6;
  const severityHint = severity <= 3 ? 'HIGH' : severity <= 4 ? 'MEDIUM' : 'INFO';

  // Best-effort action/eventType guess from common keywords — real deployments
  // should replace this with a proper normalization/mapping layer per source type.
  const lower = message.toLowerCase();
  let eventType = 'SYSTEM';
  let action = 'log_message';
  if (/(fail|denied|invalid password|authentication failure)/.test(lower)) {
    eventType = 'AUTH';
    action = 'login_failed';
  } else if (/(accepted|session opened|login successful)/.test(lower)) {
    eventType = 'AUTH';
    action = 'login_success';
  } else if (/(connect|conn|tcp|udp|port)/.test(lower)) {
    eventType = 'NETWORK';
    action = 'connection_attempt';
  }

  return { hostname, appName, message, eventType, action, severityHint };
};

const start = () => {
  if (server) return server;

  server = dgram.createSocket('udp4');

  server.on('message', async (msg, rinfo) => {
    received += 1;
    lastReceivedAt = new Date();

    try {
      const parsed = parseSyslogLine(msg.toString('utf8'), rinfo.address);
      const eventId = await nextEventId();

      const event = await Event.create({
        eventId,
        timestamp: new Date(),
        source: `syslog:${parsed.appName}`,
        hostname: parsed.hostname,
        sourceIp: rinfo.address,
        eventType: parsed.eventType,
        action: parsed.action,
        severityHint: parsed.severityHint,
        metadata: { rawMessage: parsed.message, receivedVia: 'syslog-udp' },
      });

      await processEvent(event);
    } catch (err) {
      console.error('Syslog ingestion error:', err.message);
    }
  });

  server.on('error', (err) => {
    console.error(`Syslog listener error: ${err.message}`);
  });

  server.bind(PORT, () => {
    console.log(`📡 Real syslog UDP listener active on port ${PORT} — point network devices/rsyslog at this host:${PORT}`);
  });

  return server;
};

const stop = () => {
  if (server) {
    server.close();
    server = null;
  }
};

const status = () => ({
  active: !!server,
  port: PORT,
  messagesReceived: received,
  lastReceivedAt,
});

module.exports = { start, stop, status };
