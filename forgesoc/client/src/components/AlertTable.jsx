import { useNavigate } from 'react-router-dom';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';

const AlertTable = ({ alerts }) => {
  const navigate = useNavigate();

  if (!alerts?.length) {
    return (
      <div className="panel p-10 text-center text-forge-muted font-mono text-sm">
        No alerts match the current filters.
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-forge-border text-left text-xs font-mono text-forge-muted uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Alert ID</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Source IP</th>
            <th className="px-4 py-3 font-medium">Host</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr
              key={a._id}
              onClick={() => navigate(`/alerts/${a._id}`)}
              className="border-b border-forge-border/40 last:border-0 hover:bg-[#3fe0c5]/5 hover:shadow-[inset_4px_0_0_#3fe0c5] cursor-pointer transition-all duration-200 group"
            >
              <td className="px-4 py-4 font-mono text-forge-accent font-bold group-hover:text-shadow-glow">{a.alertId}</td>
              <td className="px-4 py-4 font-medium text-[#c9d6e3] group-hover:text-white transition-colors">{a.title}</td>
              <td className="px-4 py-4">
                <SeverityBadge severity={a.severity} />
              </td>
              <td className="px-4 py-4 font-mono text-forge-muted group-hover:text-[#c9d6e3] transition-colors">{a.sourceIp || '—'}</td>
              <td className="px-4 py-4 font-mono text-forge-muted group-hover:text-[#c9d6e3] transition-colors">{a.hostname || '—'}</td>
              <td className="px-4 py-4">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-4 py-4 font-mono text-xs text-forge-muted">
                {new Date(a.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlertTable;
