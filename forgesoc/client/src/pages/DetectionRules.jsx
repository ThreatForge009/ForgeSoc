import { useEffect, useState } from 'react';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';

const DetectionRules = () => {
  const [rules, setRules] = useState([]);

  const load = () => api.get('/rules').then((res) => setRules(res.data));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id) => {
    await api.patch(`/rules/${id}/toggle`);
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-mono text-lg text-forge-text">
        Detection Rules <span className="text-forge-muted text-sm">({rules.length})</span>
      </h2>

      <div className="flex flex-col gap-3">
        {rules.map((r) => (
          <div key={r._id} className="panel p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs text-forge-accent">{r.ruleCode}</span>
                <span className="font-medium text-forge-text">{r.name}</span>
                <SeverityBadge severity={r.severity} />
              </div>
              <p className="text-sm text-forge-muted">{r.description}</p>
              <div className="mt-2 text-xs font-mono text-forge-muted">
                IF {r.condition?.eventType}
                {r.condition?.action ? ` · action=${r.condition.action}` : ''} · count ≥{' '}
                {r.condition?.thresholdCount} within {r.condition?.windowMinutes}m grouped by{' '}
                {r.condition?.groupBy}
              </div>
            </div>
            <button
              onClick={() => toggle(r._id)}
              className={`shrink-0 font-mono text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                r.enabled
                  ? 'border-forge-accent/40 text-forge-accent hover:bg-forge-accent/10'
                  : 'border-forge-border text-forge-muted hover:text-forge-text'
              }`}
            >
              {r.enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="panel p-10 text-center text-forge-muted font-mono text-sm">
            No detection rules configured. Run the seed script to load the default rule set.
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectionRules;
