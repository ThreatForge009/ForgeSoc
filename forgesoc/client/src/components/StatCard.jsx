const StatCard = ({ label, value, accent = false, sub }) => (
  <div className="panel px-5 py-4 flex flex-col gap-1 min-w-[140px] hover:-translate-y-1 hover:border-[#3fe0c5]/40 hover:shadow-[0_0_20px_rgba(63,224,197,0.15)] transition-all duration-300 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-[#3fe0c5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    <span className="font-mono text-[10px] text-forge-accent tracking-[0.2em] font-semibold">{label}</span>
    <span
      className={`stat-value text-4xl font-bold font-mono tracking-tight mt-1 ${
        accent ? 'text-forge-critical text-shadow-glow' : 'text-forge-text'
      }`}
    >
      {value}
    </span>
    {sub && <span className="text-[11px] text-forge-muted mt-1 uppercase tracking-wider">{sub}</span>}
  </div>
);

export default StatCard;
