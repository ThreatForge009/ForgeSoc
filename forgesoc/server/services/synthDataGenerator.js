/**
 * Seeds ForgeSOC with synthetic data for development and demos:
 * users, assets, detection rules, and a stream of realistic events
 * (some benign, some crafted to trip the detection rules and produce alerts).
 *
 * Run with: npm run seed   (from /server)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Asset = require('../models/Asset');
const DetectionRule = require('../models/DetectionRule');
const Event = require('../models/Event');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const BlockedIP = require('../models/BlockedIP');
const Playbook = require('../models/Playbook');
const { processEvent } = require('./eventProcessor');

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomIp = () => `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
const randomExternalIp = () =>
  `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(
    Math.random() * 255
  )}.${Math.floor(Math.random() * 255)}`;

const seedUsers = async () => {
  const users = [
    { name: 'Admin User', email: 'admin@forgesoc.local', password: 'Password123!', role: 'ADMIN', title: 'Platform Admin' },
    { name: 'Sami', email: 'sami@forgesoc.local', password: 'Password123!', role: 'SOC_ANALYST', title: 'SOC Analyst' },
    { name: 'Ali', email: 'ali@forgesoc.local', password: 'Password123!', role: 'SOC_ANALYST', title: 'Incident Response' },
    { name: 'Ahmed', email: 'ahmed@forgesoc.local', password: 'Password123!', role: 'SOC_ANALYST', title: 'Threat Research' },
    { name: 'Viewer User', email: 'viewer@forgesoc.local', password: 'Password123!', role: 'VIEWER', title: 'Stakeholder' },
  ];

  const created = [];
  for (const u of users) {
    let user = await User.findOne({ email: u.email });
    if (!user) user = await User.create(u);
    created.push(user);
  }
  console.log(`👤 Users ready: ${created.length}`);
  return created;
};

const seedAssets = async () => {
  const assets = [
    { hostname: 'WIN-SRV-01', assetType: 'Windows Server', ip: '192.168.1.10', os: 'Windows Server 2022', owner: 'IT Ops', location: 'DC-1', status: 'ONLINE', riskLevel: 'MEDIUM' },
    { hostname: 'WEB-SRV-01', assetType: 'Linux Server', ip: '192.168.1.20', os: 'Ubuntu 22.04', owner: 'DevOps', location: 'DC-1', status: 'ONLINE', riskLevel: 'HIGH' },
    { hostname: 'DB-SRV-01', assetType: 'Linux Server', ip: '192.168.1.21', os: 'Ubuntu 22.04', owner: 'DevOps', location: 'DC-1', status: 'ONLINE', riskLevel: 'CRITICAL' },
    { hostname: 'USER-PC-04', assetType: 'Windows Workstation', ip: '192.168.1.44', os: 'Windows 11', owner: 'Finance', location: 'HQ-2F', status: 'OFFLINE', riskLevel: 'LOW' },
    { hostname: 'USER-PC-07', assetType: 'Windows Workstation', ip: '192.168.1.47', os: 'Windows 11', owner: 'Sales', location: 'HQ-1F', status: 'ONLINE', riskLevel: 'LOW' },
    { hostname: 'MAC-DEV-02', assetType: 'macOS', ip: '192.168.1.55', os: 'macOS Sonoma', owner: 'Engineering', location: 'HQ-3F', status: 'ONLINE', riskLevel: 'MEDIUM' },
  ];

  const created = [];
  for (const a of assets) {
    let asset = await Asset.findOne({ hostname: a.hostname });
    if (!asset) asset = await Asset.create(a);
    created.push(asset);
  }
  console.log(`🖥️  Assets ready: ${created.length}`);
  return created;
};

const seedRules = async () => {
  const rules = [
    {
      ruleCode: 'BRUTE_FORCE_001',
      name: 'Multiple Failed Logins',
      description: 'More than 5 failed logins (Event ID 4625) from the same source IP within 5 minutes.',
      category: 'Multiple Failed Logins',
      condition: { eventType: 'AUTH', action: 'login_failed', windowsEventId: 4625, thresholdCount: 5, windowMinutes: 5, groupBy: 'sourceIp' },
      severity: 'HIGH',
      mitre: { tactic: 'Credential Access', techniqueId: 'T1110', techniqueName: 'Brute Force' },
      autoBlock: true,
      correlationWeight: 2,
    },
    {
      ruleCode: 'PORT_SCAN_001',
      name: 'Port Scan Detection',
      description: 'More than 10 distinct connection attempts from the same source IP within 2 minutes.',
      category: 'Port Scan Detection',
      condition: { eventType: 'NETWORK', action: 'connection_attempt', thresholdCount: 10, windowMinutes: 2, groupBy: 'sourceIp' },
      severity: 'MEDIUM',
      mitre: { tactic: 'Reconnaissance', techniqueId: 'T1595', techniqueName: 'Active Scanning' },
      autoBlock: false,
      correlationWeight: 1,
    },
    {
      ruleCode: 'PRIV_CHANGE_001',
      name: 'Privilege Change',
      description: 'A privilege escalation or group membership change was observed (Event ID 4672).',
      category: 'Privilege Change',
      condition: { eventType: 'PRIVILEGE', action: 'privilege_escalation', windowsEventId: 4672, thresholdCount: 1, windowMinutes: 1, groupBy: 'hostname' },
      severity: 'CRITICAL',
      mitre: { tactic: 'Privilege Escalation', techniqueId: 'T1078', techniqueName: 'Valid Accounts' },
      autoBlock: false,
      correlationWeight: 2,
    },
    {
      ruleCode: 'SUS_PROCESS_001',
      name: 'Suspicious Process',
      description: 'A known suspicious process pattern was launched (Event ID 4688 — encoded PowerShell).',
      category: 'Suspicious Process',
      condition: { eventType: 'PROCESS', action: 'suspicious_process_start', windowsEventId: 4688, thresholdCount: 1, windowMinutes: 1, groupBy: 'hostname' },
      severity: 'HIGH',
      mitre: { tactic: 'Execution', techniqueId: 'T1059.001', techniqueName: 'PowerShell' },
      autoBlock: false,
      correlationWeight: 2,
    },
    {
      ruleCode: 'ABNORMAL_AUTH_001',
      name: 'Abnormal Authentication',
      description: 'Authentication succeeded from an unusual external source IP (Event ID 4624).',
      category: 'Abnormal Authentication',
      condition: { eventType: 'AUTH', action: 'login_success_external', windowsEventId: 4624, thresholdCount: 1, windowMinutes: 1, groupBy: 'sourceIp' },
      severity: 'MEDIUM',
      mitre: { tactic: 'Initial Access', techniqueId: 'T1078', techniqueName: 'Valid Accounts' },
      autoBlock: false,
      correlationWeight: 1,
    },
    {
      ruleCode: 'RANSOM_BEHAVIOR_001',
      name: 'Mass File Modification',
      description: 'A high rate of file rename/encrypt operations on one host — a common ransomware signature.',
      category: 'Other',
      condition: { eventType: 'FILE', action: 'file_mass_modify', thresholdCount: 3, windowMinutes: 2, groupBy: 'hostname' },
      severity: 'CRITICAL',
      mitre: { tactic: 'Impact', techniqueId: 'T1486', techniqueName: 'Data Encrypted for Impact' },
      autoBlock: true,
      correlationWeight: 3,
    },
  ];

  const created = [];
  for (const r of rules) {
    let rule = await DetectionRule.findOne({ ruleCode: r.ruleCode });
    if (!rule) rule = await DetectionRule.create(r);
    created.push(rule);
  }
  console.log(`🧠 Detection rules ready: ${created.length}`);
  return created;
};

const seedPlaybooks = async () => {
  const playbooks = [
    {
      name: 'Auto-block critical brute force / ransomware sources',
      description: 'Immediately blocks the source IP for any CRITICAL alert, regardless of category.',
      trigger: { severities: ['CRITICAL'], categories: [] },
      actions: [{ type: 'BLOCK_IP', params: {} }],
    },
    {
      name: 'Notify on High/Critical alerts',
      description: 'Sends a Slack + email notification for any HIGH or CRITICAL severity alert (no-op until SLACK_WEBHOOK_URL / SMTP are configured).',
      trigger: { severities: ['CRITICAL', 'HIGH'], categories: [] },
      actions: [{ type: 'NOTIFY_SLACK', params: {} }, { type: 'NOTIFY_EMAIL', params: {} }],
    },
    {
      name: 'Auto-assign privilege escalations to Incident Response',
      description: 'Routes any Privilege Change alert straight to the Incident Response analyst.',
      trigger: { severities: [], categories: ['Privilege Change'] },
      actions: [{ type: 'ASSIGN_ANALYST', params: { role: 'SOC_ANALYST' } }],
    },
  ];

  for (const pb of playbooks) {
    const existing = await Playbook.findOne({ name: pb.name });
    if (!existing) await Playbook.create(pb);
  }
  console.log(`🤖 Playbooks ready: ${playbooks.length}`);
};

let eventCounter = 0;
const nextEventId = async () => {
  if (!eventCounter) eventCounter = await Event.countDocuments();
  eventCounter += 1;
  return `EVT-${String(10000 + eventCounter)}`;
};

const emitEvent = async (overrides = {}) => {
  const eventId = await nextEventId();
  const event = await Event.create({
    eventId,
    timestamp: new Date(),
    ...overrides,
  });
  const result = await processEvent(event);
  return result;
};

const generateBenignTraffic = async (assets, count = 40) => {
  const eventTypes = ['AUTH', 'NETWORK', 'PROCESS', 'SYSTEM'];
  for (let i = 0; i < count; i++) {
    const asset = randomFrom(assets);
    const type = randomFrom(eventTypes);
    await emitEvent({
      source: randomFrom(['Windows-Security', 'Syslog', 'Firewall', 'EDR']),
      hostname: asset.hostname,
      sourceIp: asset.ip,
      destinationIp: randomIp(),
      eventType: type,
      action: type === 'AUTH' ? 'login_success' : type === 'NETWORK' ? 'connection_established' : 'process_start',
      username: randomFrom(['jsmith', 'aali', 'rkhan', 'svc_backup']),
      protocol: randomFrom(['TCP', 'UDP', 'HTTPS']),
      port: randomFrom([443, 22, 3389, 8080]),
      severityHint: 'INFO',
    });
  }
};

const generateBruteForceAttack = async (attackerIp = randomExternalIp()) => {
  for (let i = 0; i < 7; i++) {
    await emitEvent({
      source: 'Windows-Security',
      hostname: 'WIN-SRV-01',
      sourceIp: attackerIp,
      destinationIp: '192.168.1.10',
      eventType: 'AUTH',
      action: 'login_failed',
      windowsEventId: 4625,
      username: 'administrator',
      protocol: 'RDP',
      port: 3389,
      severityHint: 'MEDIUM',
    });
  }
  console.log(`💥 Simulated brute force attack from ${attackerIp}`);
  return attackerIp;
};

const generatePortScan = async () => {
  const attackerIp = randomExternalIp();
  for (let i = 0; i < 12; i++) {
    await emitEvent({
      source: 'Firewall',
      hostname: 'WEB-SRV-01',
      sourceIp: attackerIp,
      destinationIp: '192.168.1.20',
      eventType: 'NETWORK',
      action: 'connection_attempt',
      protocol: 'TCP',
      port: 1024 + i,
      severityHint: 'LOW',
    });
  }
  console.log(`💥 Simulated port scan from ${attackerIp}`);
};

const generatePrivilegeEscalation = async (hostname = 'DB-SRV-01', sourceIp = '192.168.1.21') => {
  await emitEvent({
    source: 'Windows-Security',
    hostname,
    sourceIp,
    eventType: 'PRIVILEGE',
    action: 'privilege_escalation',
    windowsEventId: 4672,
    username: 'svc_backup',
    severityHint: 'CRITICAL',
    metadata: { addedTo: 'Domain Admins' },
  });
  console.log(`💥 Simulated privilege escalation on ${hostname}`);
};

const generateSuspiciousProcess = async (hostname = 'USER-PC-07', sourceIp = '192.168.1.47') => {
  await emitEvent({
    source: 'EDR',
    hostname,
    sourceIp,
    eventType: 'PROCESS',
    action: 'suspicious_process_start',
    windowsEventId: 4688,
    username: 'jsmith',
    severityHint: 'HIGH',
    metadata: { process: 'powershell.exe', args: '-enc <base64>' },
  });
  console.log(`💥 Simulated suspicious PowerShell execution on ${hostname}`);
};

/**
 * A realistic multi-stage attack chain, all pivoting on one external attacker
 * IP and one internal host: brute force → successful abnormal login →
 * privilege escalation → suspicious process → mass file modification
 * (ransomware-like). Each stage trips its own detection rule; because they
 * share a source IP / hostname within the correlation window, the
 * correlation engine should automatically roll them up into one Incident,
 * and the brute-force + ransomware rules (autoBlock: true) should push the
 * attacker IP onto the real-time blocklist.
 */
const generateAttackChain = async () => {
  const attackerIp = randomExternalIp();
  const targetHost = 'DB-SRV-01';
  const targetIp = '192.168.1.21';

  await generateBruteForceAttack(attackerIp);

  await emitEvent({
    source: 'Windows-Security',
    hostname: targetHost,
    sourceIp: attackerIp,
    destinationIp: targetIp,
    eventType: 'AUTH',
    action: 'login_success_external',
    windowsEventId: 4624,
    username: 'administrator',
    protocol: 'RDP',
    port: 3389,
    severityHint: 'MEDIUM',
  });

  await generatePrivilegeEscalation(targetHost, attackerIp);
  await generateSuspiciousProcess(targetHost, attackerIp);

  for (let i = 0; i < 3; i++) {
    await emitEvent({
      source: 'EDR',
      hostname: targetHost,
      sourceIp: attackerIp,
      eventType: 'FILE',
      action: 'file_mass_modify',
      username: 'administrator',
      severityHint: 'CRITICAL',
      metadata: { filesTouched: 40 + i * 25, extension: '.locked' },
    });
  }

  console.log(`💥 Simulated full attack chain (recon → brute force → escalation → ransomware) from ${attackerIp} on ${targetHost}`);
};

const run = async () => {
  await connectDB();

  const users = await seedUsers();
  const analysts = users.filter((u) => u.role === 'SOC_ANALYST');
  const assets = await seedAssets();
  await seedRules();
  await seedPlaybooks();

  console.log('📡 Generating synthetic event stream...');
  await generateBenignTraffic(assets, 40);
  await generatePortScan();
  await generateAttackChain(); // triggers correlation → auto-incident, and auto-block
  await generateBenignTraffic(assets, 15);

  const eventCount = await Event.countDocuments();
  const alertCount = await Alert.countDocuments();
  const incidentCount = await Incident.countDocuments();
  const blockCount = await BlockedIP.countDocuments({ active: true });
  console.log(
    `✅ Seed complete. Events: ${eventCount} | Alerts: ${alertCount} | Incidents: ${incidentCount} | Active blocks: ${blockCount}`
  );
  console.log('   Login with: admin@forgesoc.local / Password123!');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
