const styles = {
  OPEN: 'text-forge-critical border-forge-critical/40',
  ACKNOWLEDGED: 'text-forge-medium border-forge-medium/40',
  INVESTIGATING: 'text-forge-accent border-forge-accent/40',
  CLOSED: 'text-forge-muted border-forge-muted/40',
  ONLINE: 'text-forge-accent border-forge-accent/40',
  OFFLINE: 'text-forge-muted border-forge-muted/40',
  NEW: 'text-forge-critical border-forge-critical/40',
  TRIAGED: 'text-forge-medium border-forge-medium/40',
  CONTAINED: 'text-forge-low border-forge-low/40',
  RESOLVED: 'text-forge-accent border-forge-accent/40',
};

const StatusBadge = ({ status }) => {
  const cls = styles[status] || 'text-forge-muted border-forge-muted/40';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-sm border font-mono text-xs tracking-wide ${cls}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
