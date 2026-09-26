const typeColors = {
  AUTH: 'text-forge-low',
  NETWORK: 'text-forge-medium',
  PROCESS: 'text-forge-high',
  FILE: 'text-forge-accent',
  SYSTEM: 'text-forge-muted',
  PRIVILEGE: 'text-forge-critical',
};

const EventTable = ({ events }) => {
  if (!events?.length) {
    return (
      <div className="panel p-10 text-center text-forge-muted font-mono text-sm">
        No events match the current filters.
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-forge-border text-left text-xs font-mono text-forge-muted uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Event ID</th>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Host</th>
            <th className="px-4 py-3 font-medium">Source IP</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Event ID</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">User</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr
              key={e._id}
              className="border-b border-forge-border/60 last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-4 py-3 font-mono text-forge-accent">{e.eventId}</td>
              <td className="px-4 py-3 font-mono text-xs text-forge-muted">
                {new Date(e.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-mono">{e.hostname || '—'}</td>
              <td className="px-4 py-3 font-mono text-forge-muted">{e.sourceIp || '—'}</td>
              <td className={`px-4 py-3 font-mono text-xs font-semibold ${typeColors[e.eventType] || ''}`}>
                {e.eventType}
                {e.metadata?.blockedSourceTraffic && (
                  <span className="ml-2 text-forge-critical" title="Source IP is on the active blocklist">
                    ⛔
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-forge-muted">{e.windowsEventId || '—'}</td>
              <td className="px-4 py-3 text-forge-muted">{e.action || '—'}</td>
              <td className="px-4 py-3 font-mono text-xs">{e.username || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventTable;
