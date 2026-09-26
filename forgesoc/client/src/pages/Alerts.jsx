import { useEffect, useState } from 'react';
import api from '../services/api';
import AlertTable from '../components/AlertTable';

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'CLOSED'];

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    setLoading(true);
    const params = {};
    if (severity) params.severity = severity;
    if (status) params.status = status;
    if (q) params.q = q;
    api
      .get('/alerts', { params })
      .then((res) => {
        setAlerts(res.data.alerts);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, status]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg text-forge-text">
          Alerts <span className="text-forge-muted text-sm">({total})</span>
        </h2>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchAlerts()}
          placeholder="Search alert ID, title, IP, host..."
          className="bg-forge-panel border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text w-72 focus:border-forge-accent outline-none font-mono"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="bg-forge-panel border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none font-mono"
        >
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-forge-panel border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none font-mono"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={fetchAlerts}
          className="bg-forge-accent/15 border border-forge-accent/40 text-forge-accent font-mono text-sm px-4 py-2 rounded-sm hover:bg-forge-accent/25 transition-colors"
        >
          SEARCH
        </button>
      </div>

      {loading ? (
        <div className="panel p-10 text-center text-forge-muted font-mono text-sm">Loading...</div>
      ) : (
        <AlertTable alerts={alerts} />
      )}
    </div>
  );
};

export default Alerts;
