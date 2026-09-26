const styles = {
  CRITICAL: 'text-forge-critical border-forge-critical/40 bg-forge-critical/10',
  HIGH: 'text-forge-high border-forge-high/40 bg-forge-high/10',
  MEDIUM: 'text-forge-medium border-forge-medium/40 bg-forge-medium/10',
  LOW: 'text-forge-low border-forge-low/40 bg-forge-low/10',
  INFO: 'text-forge-muted border-forge-muted/40 bg-forge-muted/10',
};

const SeverityBadge = ({ severity }) => {
  const cls = styles[severity] || styles.INFO;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border font-mono text-xs tracking-wide ${cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
};

export default SeverityBadge;
