import { useEffect, useState } from 'react';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import { useSocket } from '../context/SocketContext';

const LIFECYCLE = ['NEW', 'TRIAGED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'];

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const socketCtx = useSocket();

  const load = () => api.get('/incidents').then((res) => setIncidents(res.data));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = socketCtx?.socket;
    if (!socket) return undefined;
    socket.on('incident:new', load);
    return () => socket.off('incident:new', load);
  }, [socketCtx?.socket]);

  const advance = async (id, status) => {
    await api.patch(`/incidents/${id}/status`, { status });
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-mono text-lg text-forge-text mb-1">
          Incidents <span className="text-forge-muted text-sm">({incidents.length})</span>
        </h2>
        <p className="text-sm text-forge-muted">
          Auto-created by the correlation engine when 2+ detection rules fire for the same
          source IP or host within a 15-minute window — a stand-in for multi-stage attack
          chain detection in a full SIEM.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {incidents.map((inc) => (
          <div key={inc._id} className="panel p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="font-mono text-xs text-forge-accent mb-1">{inc.incidentId}</div>
                <h3 className="font-medium text-forge-text">{inc.title}</h3>
                <p className="text-sm text-forge-muted mt-1 max-w-xl">{inc.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <SeverityBadge severity={inc.severity} />
                <StatusBadge status={inc.status} />
              </div>
            </div>

            {inc.relatedAlerts?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {inc.relatedAlerts.map((a) => (
                  <span
                    key={a._id}
                    className="text-xs font-mono px-2 py-1 rounded-sm border border-forge-border text-forge-muted"
                  >
                    {a.alertId} · {a.severity}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {LIFECYCLE.map((s) => (
                <button
                  key={s}
                  onClick={() => advance(inc._id, s)}
                  disabled={inc.status === s}
                  className="text-xs font-mono border border-forge-border rounded-sm px-3 py-1.5 text-forge-text hover:border-forge-accent hover:text-forge-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}

        {incidents.length === 0 && (
          <div className="panel p-10 text-center text-forge-muted font-mono text-sm">
            No incidents yet. Run the seed script's attack chain, or wait for 2+ correlated
            alerts to fire from the same source.
          </div>
        )}
      </div>
    </div>
  );
};

export default Incidents;
