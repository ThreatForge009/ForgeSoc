import { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';

const riskColor = {
  CRITICAL: 'text-forge-critical',
  HIGH: 'text-forge-high',
  MEDIUM: 'text-forge-medium',
  LOW: 'text-forge-low',
};

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get('/assets').then((res) => setAssets(res.data));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/assets/${selected}`).then((res) => setDetail(res.data));
  }, [selected]);

  return (
    <div className="flex gap-6">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
        {assets.map((a) => (
          <button
            key={a._id}
            onClick={() => setSelected(a._id)}
            className={`panel p-4 text-left hover:border-forge-accent/50 transition-colors ${
              selected === a._id ? 'border-forge-accent/60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono font-semibold text-forge-text">{a.hostname}</span>
              <StatusBadge status={a.status} />
            </div>
            <div className="text-xs text-forge-muted mb-1">{a.assetType}</div>
            <div className="text-xs font-mono text-forge-muted">{a.ip}</div>
            <div className={`text-xs font-mono mt-2 ${riskColor[a.riskLevel] || 'text-forge-muted'}`}>
              RISK: {a.riskLevel}
            </div>
          </button>
        ))}
        {assets.length === 0 && (
          <div className="panel p-10 text-center text-forge-muted font-mono text-sm col-span-full">
            No assets registered yet.
          </div>
        )}
      </div>

      {detail && (
        <aside className="w-80 shrink-0 panel p-5 h-fit sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono font-semibold text-forge-text">{detail.asset.hostname}</h3>
            <button onClick={() => setSelected(null)} className="text-forge-muted hover:text-forge-text text-sm">
              ✕
            </button>
          </div>
          <dl className="text-sm space-y-2 mb-5">
            <DetailRow label="IP" value={detail.asset.ip} />
            <DetailRow label="OS" value={detail.asset.os} />
            <DetailRow label="Owner" value={detail.asset.owner} />
            <DetailRow label="Location" value={detail.asset.location} />
            <DetailRow label="Last Seen" value={new Date(detail.asset.lastSeen).toLocaleString()} />
          </dl>
          <h4 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-2">
            Related Alerts
          </h4>
          {detail.relatedAlerts?.length ? (
            <ul className="flex flex-col gap-2">
              {detail.relatedAlerts.map((al) => (
                <li key={al._id} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-forge-accent">{al.alertId}</span>
                  <SeverityBadge severity={al.severity} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-forge-muted font-mono">No related alerts.</p>
          )}
        </aside>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-forge-muted">{label}</dt>
    <dd className="text-forge-text text-right">{value || '—'}</dd>
  </div>
);

export default Assets;
