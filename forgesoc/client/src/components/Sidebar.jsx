import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/threat-map', label: 'Threat Map', icon: '⊙' },
  { to: '/alerts', label: 'Alerts', icon: '▲' },
  { to: '/incidents', label: 'Incidents', icon: '✦' },
  { to: '/events', label: 'Events', icon: '≡' },
  { to: '/blocklist', label: 'IP Blocklist', icon: '⛔' },
  { to: '/playbooks', label: 'Playbooks', icon: '⚡' },
  { to: '/assets', label: 'Assets', icon: '▣' },
  { to: '/rules', label: 'Detection Rules', icon: '◉' },
  { to: '/reports', label: 'Reports', icon: '▤' },
];

const Sidebar = () => (
  <aside className="w-56 shrink-0 border-r border-forge-border bg-forge-panel/60 flex flex-col">
    <div className="px-5 py-6 border-b border-forge-border">
      <div className="font-mono text-lg font-bold tracking-tight text-forge-text">
        FORGE<span className="text-forge-accent">SOC</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-forge-muted font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-forge-accent animate-pulse" />
        SYSTEM ONLINE
      </div>
    </div>
    <nav className="flex-1 py-4">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-2.5 text-sm font-medium border-l-2 transition-colors ${
              isActive
                ? 'border-forge-accent text-forge-accent bg-forge-accent/5'
                : 'border-transparent text-forge-muted hover:text-forge-text hover:bg-white/[0.02]'
            }`
          }
        >
          <span className="font-mono text-base">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
    <div className="px-5 py-4 border-t border-forge-border text-xs text-forge-muted font-mono">
      v1.0.0 · Phase 1 MVP
    </div>
  </aside>
);

export default Sidebar;
