const { exec } = require('child_process');
const os = require('os');

/**
 * Real firewall enforcement. OFF (dry-run) by default so this never touches
 * your machine's actual firewall until you explicitly opt in — set
 * ENABLE_REAL_FIREWALL=true in .env once you've reviewed the commands below
 * and are running the API with sufficient privileges (root on Linux, admin
 * on Windows).
 *
 * Linux uses iptables. Windows uses netsh advfirewall. macOS is intentionally
 * unsupported here (pf rule syntax + rule-anchor management is a bigger job
 * than fits this stub) — dry-run only.
 */
const REAL_FIREWALL_ENABLED = process.env.ENABLE_REAL_FIREWALL === 'true';
const CHAIN_COMMENT = 'ForgeSOC-auto-block';

const platform = os.platform(); // 'linux', 'win32', 'darwin'

const buildBlockCommand = (ip) => {
  if (platform === 'linux') {
    return `iptables -A INPUT -s ${ip} -j DROP -m comment --comment "${CHAIN_COMMENT}"`;
  }
  if (platform === 'win32') {
    return `netsh advfirewall firewall add rule name="${CHAIN_COMMENT}-${ip}" dir=in action=block remoteip=${ip}`;
  }
  return null; // unsupported platform — caller falls back to dry-run
};

const buildUnblockCommand = (ip) => {
  if (platform === 'linux') {
    return `iptables -D INPUT -s ${ip} -j DROP -m comment --comment "${CHAIN_COMMENT}"`;
  }
  if (platform === 'win32') {
    return `netsh advfirewall firewall delete rule name="${CHAIN_COMMENT}-${ip}"`;
  }
  return null;
};

const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout);
    });
  });

/**
 * Apply (or simulate) a firewall block for an IP.
 * Returns { applied: boolean, mode: 'real'|'dry-run', command, error? }
 */
const applyBlock = async (ip) => {
  const command = buildBlockCommand(ip);

  if (!REAL_FIREWALL_ENABLED || !command) {
    return {
      applied: false,
      mode: 'dry-run',
      command: command || `(unsupported on ${platform})`,
      note: REAL_FIREWALL_ENABLED
        ? `Real firewall blocking isn't implemented for platform "${platform}" yet.`
        : 'ENABLE_REAL_FIREWALL is false — logged only, no system change made.',
    };
  }

  try {
    await runCommand(command);
    return { applied: true, mode: 'real', command };
  } catch (err) {
    return { applied: false, mode: 'real', command, error: err.message };
  }
};

const removeBlock = async (ip) => {
  const command = buildUnblockCommand(ip);

  if (!REAL_FIREWALL_ENABLED || !command) {
    return { applied: false, mode: 'dry-run', command: command || `(unsupported on ${platform})` };
  }

  try {
    await runCommand(command);
    return { applied: true, mode: 'real', command };
  } catch (err) {
    return { applied: false, mode: 'real', command, error: err.message };
  }
};

const status = () => ({
  enabled: REAL_FIREWALL_ENABLED,
  platform,
  supported: platform === 'linux' || platform === 'win32',
});

module.exports = { applyBlock, removeBlock, status };
