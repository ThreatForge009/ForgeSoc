import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';

const VERDICTS = [
  { value: 'FALSE_POSITIVE', label: 'False Positive' },
  { value: 'SUSPICIOUS', label: 'Suspicious' },
  { value: 'CONFIRMED_INCIDENT', label: 'Confirmed Incident' },
];

const AlertDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [analysts, setAnalysts] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get(`/alerts/${id}`).then((res) => setAlert(res.data));
  };

  useEffect(() => {
    load();
    api.get('/auth/analysts').then((res) => setAnalysts(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status) => {
    await api.patch(`/alerts/${id}/status`, { status });
    load();
  };

  const setVerdict = async (verdict) => {
    await api.patch(`/alerts/${id}/verdict`, { verdict });
    load();
  };

  const assign = async (userId) => {
    await api.patch(`/alerts/${id}/assign`, { userId });
    load();
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await api.post(`/alerts/${id}/notes`, { text: noteText });
      setNoteText('');
      load();
    } finally {
      setSaving(false);
    }
  };

  if (!alert) {
    return <div className="panel p-10 text-center text-forge-muted font-mono text-sm">Loading investigation...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <button
        onClick={() => navigate('/alerts')}
        className="text-xs font-mono text-forge-muted hover:text-forge-accent w-fit"
      >
        ← BACK TO ALERTS
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-forge-accent text-sm mb-1">{alert.alertId}</div>
          <h2 className="text-xl font-semibold text-forge-text">{alert.title}</h2>
          <p className="text-sm text-forge-muted mt-1 max-w-2xl">{alert.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SeverityBadge severity={alert.severity} />
          <StatusBadge status={alert.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel p-4">
          <h4 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-3">Overview</h4>
          <dl className="text-sm space-y-2">
            <Row label="Detection Rule" value={alert.ruleId?.name || '—'} />
            <Row label="Category" value={alert.category || '—'} />
            <Row label="Time" value={new Date(alert.createdAt).toLocaleString()} />
            {alert.ruleId?.mitre?.techniqueId && (
              <Row
                label="MITRE ATT&CK"
                value={`${alert.ruleId.mitre.techniqueId} — ${alert.ruleId.mitre.techniqueName}`}
                mono
              />
            )}
            {alert.ruleId?.mitre?.tactic && <Row label="Tactic" value={alert.ruleId.mitre.tactic} />}
            {alert.ruleId?.autoBlock && (
              <Row label="Response" value="Auto-block enabled for this rule" />
            )}
          </dl>
        </div>
        <div className="panel p-4">
          <h4 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-3">Source</h4>
          <dl className="text-sm space-y-2">
            <Row label="IP" value={alert.sourceIp || '—'} mono />
            <Row label="Hostname" value={alert.hostname || '—'} mono />
            <Row label="User" value={alert.username || '—'} mono />
          </dl>
        </div>
        <div className="panel p-4">
          <h4 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-3">Target</h4>
          <dl className="text-sm space-y-2">
            <Row label="Destination IP" value={alert.destinationIp || '—'} mono />
          </dl>
        </div>
      </div>

      <div className="panel p-4">
        <h4 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-3">Timeline</h4>
        {alert.relatedEvents?.length ? (
          <ul className="space-y-2">
            {alert.relatedEvents.map((e) => (
              <li key={e._id} className="flex gap-3 text-sm font-mono">
                <span className="text-forge-muted">{new Date(e.timestamp).toLocaleTimeString()}</span>
                <span className="text-forge-text">{e.action}</span>
                <span className="text-forge-muted">from {e.sourceIp}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-forge-muted font-mono">No linked events.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel p-4 flex flex-col gap-3">
          <h4 className="font-mono text-xs text-forge-muted uppercase tracking-wider">Actions</h4>
          <div className="flex flex-wrap gap-2">
            {['ACKNOWLEDGED', 'INVESTIGATING', 'CLOSED'].map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={alert.status === s}
                className="text-xs font-mono border border-forge-border rounded-sm px-3 py-1.5 text-forge-text hover:border-forge-accent hover:text-forge-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider mt-2">Assigned To</label>
          <select
            value={alert.assignedTo?._id || ''}
            onChange={(e) => assign(e.target.value)}
            className="bg-forge-bg border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none font-mono"
          >
            <option value="">Unassigned</option>
            {analysts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} — {a.title}
              </option>
            ))}
          </select>
        </div>

        <div className="panel p-4 flex flex-col gap-3">
          <h4 className="font-mono text-xs text-forge-muted uppercase tracking-wider">Analyst Verdict</h4>
          <div className="flex flex-col gap-2">
            {VERDICTS.map((v) => (
              <label key={v.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  checked={alert.verdict === v.value}
                  onChange={() => setVerdict(v.value)}
                  className="accent-forge-accent"
                />
                {v.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="panel p-4 flex flex-col gap-3">
        <h4 className="font-mono text-xs text-forge-muted uppercase tracking-wider">Investigation Notes</h4>
        {alert.notes?.length > 0 && (
          <ul className="flex flex-col gap-2 mb-2">
            {alert.notes.map((n, i) => (
              <li key={i} className="text-sm border-l-2 border-forge-border pl-3">
                <div className="text-forge-text">{n.text}</div>
                <div className="text-xs text-forge-muted font-mono mt-0.5">
                  {n.author?.name || 'Analyst'} · {new Date(n.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write investigation notes..."
          rows={3}
          className="bg-forge-bg border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none resize-none"
        />
        <button
          onClick={saveNote}
          disabled={saving || !noteText.trim()}
          className="self-end bg-forge-accent/15 border border-forge-accent/40 text-forge-accent font-mono text-xs px-4 py-2 rounded-sm hover:bg-forge-accent/25 transition-colors disabled:opacity-40"
        >
          {saving ? 'SAVING...' : 'SAVE NOTE'}
        </button>
      </div>
    </div>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-forge-muted">{label}</dt>
    <dd className={mono ? 'font-mono text-forge-text' : 'text-forge-text'}>{value}</dd>
  </div>
);

export default AlertDetails;
