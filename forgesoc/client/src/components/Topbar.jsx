import { useAuth } from '../context/AuthContext';

const Topbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-forge-border bg-forge-panel/40 flex items-center justify-between px-6">
      <h1 className="font-mono text-sm tracking-[0.2em] text-forge-muted uppercase">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <div className="text-sm text-forge-text">{user?.name}</div>
          <div className="text-xs text-forge-muted font-mono">{user?.role}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-forge-accent/15 border border-forge-accent/40 flex items-center justify-center text-forge-accent font-mono text-xs font-bold">
          {user?.name?.charAt(0) || '?'}
        </div>
        <button
          onClick={logout}
          className="text-xs font-mono text-forge-muted hover:text-forge-critical transition-colors border border-forge-border rounded-sm px-3 py-1.5 hover:border-forge-critical/40"
        >
          SIGN OUT
        </button>
      </div>
    </header>
  );
};

export default Topbar;
