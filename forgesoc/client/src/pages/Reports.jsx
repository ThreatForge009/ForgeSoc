import { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    api.get('/reports/summary', { params }).then((res) => setSummary(res.data));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = (endpoint) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const token = localStorage.getItem('forgesoc_token');
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    // Direct navigation so the browser handles the file download / Content-Disposition header
    fetch(`${base}/reports/${endpoint}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forgesoc-${endpoint}`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="font-mono text-lg text-forge-text mb-1">Reports</h2>
        <p className="text-sm text-forge-muted">Period summary and raw CSV exports for alerts and events.</p>
      </div>

      <div className="panel p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-forge-bg border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-forge-bg border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none font-mono"
          />
        </div>
        <button
          onClick={load}
          className="bg-forge-accent/15 border border-forge-accent/40 text-forge-accent font-mono text-sm px-4 py-2 rounded-sm hover:bg-forge-accent/25 transition-colors"
        >
          APPLY PERIOD
        </button>
      </div>

      {summary && (
        <div className="flex flex-wrap gap-4">
          <StatCard label="EVENTS IN PERIOD" value={summary.totalEvents} />
          <StatCard label="ALERTS IN PERIOD" value={summary.totalAlerts} />
          <StatCard
            label="CRITICAL"
            value={summary.bySeverity.find((s) => s._id === 'CRITICAL')?.count || 0}
            accent
          />
        </div>
      )}

      <div className="panel p-5 flex flex-col gap-3">
        <h3 className="font-mono text-xs text-forge-muted uppercase tracking-wider">Export</h3>
        <div className="flex gap-3">
          <button
            onClick={() => downloadCsv('alerts.csv')}
            className="text-xs font-mono border border-forge-border rounded-sm px-4 py-2 hover:border-forge-accent hover:text-forge-accent transition-colors"
          >
            ⬇ ALERTS CSV
          </button>
          <button
            onClick={() => downloadCsv('events.csv')}
            className="text-xs font-mono border border-forge-border rounded-sm px-4 py-2 hover:border-forge-accent hover:text-forge-accent transition-colors"
          >
            ⬇ EVENTS CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
