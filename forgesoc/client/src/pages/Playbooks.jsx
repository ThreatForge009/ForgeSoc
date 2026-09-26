import { useEffect, useState } from 'react';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';

const ACTION_LABEL = {
  BLOCK_IP: '⛔ Block source IP',
  NOTIFY_SLACK: '💬 Notify Slack',
  NOTIFY_EMAIL: '✉ Notify Email',
  ASSIGN_ANALYST: '👤 Assign analyst',
};

const Playbooks = () => {
  const [playbooks, setPlaybooks] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);

  const load = () => api.get('/playbooks').then((res) => setPlaybooks(res.data));

  useEffect(() => {
    load();
    api.get('/system/status').then((res) => setSystemStatus(res.data));
  }, []);

  const toggle = async (id) => {
    await api.patch(`/playbooks/${id}/toggle`);
    load();
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="font-mono text-lg text-forge-text mb-1">
          Playbooks <span className="text-forge-muted text-sm">({playbooks.length})</span>
        </h2>
        <p className="text-sm text-forge-muted">
          SOAR-style automated response: when a new alert matches a playbook's trigger, its actions
          run automatically — no analyst click required.
        </p>
      </div>

      {systemStatus && (
        <div className="panel p-4 flex flex-wrap gap-6 text-xs font-mono">
          <StatusLine label="Firewall enforcement" ok={systemStatus.firewall.enabled} okText="LIVE" offText="DRY-RUN" />
          <StatusLine label="Slack notifications" ok={systemStatus.notifications.slack} okText="CONFIGURED" offText="NOT SET" />
          <StatusLine label="Email notifications" ok={systemStatus.notifications.email} okText="CONFIGURED" offText="NOT SET" />
          <StatusLine label="Threat intel (AbuseIPDB)" ok={systemStatus.threatIntel} okText="CONFIGURED" offText="NOT SET" />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {playbooks.map((pb) => (
          <div key={pb._id} className="panel p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-forge-text">{pb.name}</h3>
                <p className="text-sm text-forge-muted mt-1">{pb.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {pb.trigger.severities?.map((s) => (
                    <SeverityBadge key={s} severity={s} />
                  ))}
                  {pb.trigger.categories?.map((c) => (
                    <span key={c} className="text-xs font-mono px-2 py-0.5 rounded-sm border border-forge-border text-forge-muted">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pb.actions.map((a, i) => (
                    <span key={i} className="text-xs font-mono text-forge-accent">
                      {ACTION_LABEL[a.type] || a.type}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-forge-muted font-mono mt-2">
                  Ran {pb.runCount} time{pb.runCount === 1 ? '' : 's'}
                  {pb.lastRunAt && ` · last: ${new Date(pb.lastRunAt).toLocaleString()}`}
                </div>
              </div>
              <button
                onClick={() => toggle(pb._id)}
                className={`shrink-0 font-mono text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                  pb.enabled
                    ? 'border-forge-accent/40 text-forge-accent hover:bg-forge-accent/10'
                    : 'border-forge-border text-forge-muted hover:text-forge-text'
                }`}
              >
                {pb.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        ))}
        {playbooks.length === 0 && (
          <div className="panel p-10 text-center text-forge-muted font-mono text-sm">
            No playbooks configured. Run the seed script to load the default set.
          </div>
        )}
      </div>
    </div>
  );
};

const StatusLine = ({ label, ok, okText, offText }) => (
  <div className="flex items-center gap-2">
    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-forge-accent' : 'bg-forge-muted'}`} />
    <span className="text-forge-muted">{label}:</span>
    <span className={ok ? 'text-forge-accent' : 'text-forge-muted'}>{ok ? okText : offText}</span>
  </div>
);

export default Playbooks;
