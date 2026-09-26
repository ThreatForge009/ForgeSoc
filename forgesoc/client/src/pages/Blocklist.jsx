import { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const Blocklist = () => {
  const [entries, setEntries] = useState([]);
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [firewallStatus, setFirewallStatus] = useState(null);
  const socketCtx = useSocket();

  const load = () => api.get('/blocklist').then((res) => setEntries(res.data));

  useEffect(() => {
    load();
    api.get('/system/status').then((res) => setFirewallStatus(res.data.firewall));
  }, []);

  // Live-refresh the list whenever the backend auto-blocks or unblocks something
  useEffect(() => {
    const socket = socketCtx?.socket;
    if (!socket) return undefined;
    const refresh = () => load();
    socket.on('ip:blocked', refresh);
    socket.on('ip:unblocked', refresh);
    return () => {
      socket.off('ip:blocked', refresh);
      socket.off('ip:unblocked', refresh);
    };
  }, [socketCtx?.socket]);

  const submitBlock = async (e) => {
    e.preventDefault();
    if (!ip.trim() || !reason.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/blocklist', { ip: ip.trim(), reason: reason.trim() });
      setIp('');
      setReason('');
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const unblock = async (id) => {
    await api.patch(`/blocklist/${id}/unblock`);
    load();
  };

  const active = entries.filter((e) => e.active);
  const historical = entries.filter((e) => !e.active);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="font-mono text-lg text-forge-text mb-1">
          Real-Time IP Blocklist <span className="text-forge-muted text-sm">({active.length} active)</span>
        </h2>
        <p className="text-sm text-forge-muted">
          IPs here are enforced live: any further events from a blocked source are tagged as
          <span className="font-mono text-forge-critical"> blocked-source traffic</span> the moment they arrive.
          Rules flagged <span className="font-mono text-forge-accent">autoBlock</span> push a source here
          automatically the instant they fire.
        </p>
        {firewallStatus && (
          <div className="mt-3 flex items-center gap-2 text-xs font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${firewallStatus.enabled ? 'bg-forge-critical animate-pulse' : 'bg-forge-muted'}`} />
            <span className="text-forge-muted">OS firewall enforcement:</span>
            <span className={firewallStatus.enabled ? 'text-forge-critical' : 'text-forge-muted'}>
              {firewallStatus.enabled ? `LIVE (${firewallStatus.platform})` : 'DRY-RUN (logged only, no system change)'}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={submitBlock} className="panel p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">IP Address</label>
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="203.0.113.42"
            className="bg-forge-bg border border-forge-border rounded-sm px-3 py-2 text-sm font-mono text-forge-text w-48 focus:border-forge-accent outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Reason</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Manual block — confirmed malicious scanning"
            className="bg-forge-bg border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text w-full focus:border-forge-accent outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-forge-critical/15 border border-forge-critical/40 text-forge-critical font-mono text-sm px-4 py-2 rounded-sm hover:bg-forge-critical/25 transition-colors disabled:opacity-50"
        >
          BLOCK IP
        </button>
      </form>

      <div>
        <h3 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-3">Active Blocks</h3>
        <BlockTable entries={active} onUnblock={unblock} showUnblock />
      </div>

      {historical.length > 0 && (
        <div>
          <h3 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-3">History</h3>
          <BlockTable entries={historical} />
        </div>
      )}
    </div>
  );
};

const BlockTable = ({ entries, onUnblock, showUnblock }) => {
  if (!entries.length) {
    return <div className="panel p-8 text-center text-forge-muted font-mono text-sm">No entries.</div>;
  }
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-forge-border text-left text-xs font-mono text-forge-muted uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">IP</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Blocked At</th>
            {showUnblock && <th className="px-4 py-3 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e._id} className="border-b border-forge-border/60 last:border-0">
              <td className="px-4 py-3 font-mono text-forge-critical">{e.ip}</td>
              <td className="px-4 py-3 text-forge-muted">{e.reason}</td>
              <td className="px-4 py-3">
                {e.autoBlocked ? (
                  <span className="font-mono text-xs text-forge-accent">
                    AUTO · {e.triggeredByRule?.ruleCode || 'rule'}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-forge-muted">
                    MANUAL · {e.blockedBy?.name || 'analyst'}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-forge-muted">
                {new Date(e.createdAt).toLocaleString()}
              </td>
              {showUnblock && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onUnblock(e._id)}
                    className="text-xs font-mono border border-forge-border rounded-sm px-3 py-1.5 hover:border-forge-accent hover:text-forge-accent transition-colors"
                  >
                    UNBLOCK
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Blocklist;
