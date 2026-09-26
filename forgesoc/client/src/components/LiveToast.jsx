import { useSocket } from '../context/SocketContext';
import SeverityBadge from './SeverityBadge';

const LiveToast = () => {
  const ctx = useSocket();
  if (!ctx?.toast) return null;
  const { toast, dismissToast } = ctx;

  return (
    <div className="fixed bottom-6 right-6 z-50 panel px-4 py-3 flex items-center gap-3 shadow-lg border-forge-accent/30 animate-[fadeIn_0.2s_ease-out]">
      <span className="w-2 h-2 rounded-full bg-forge-accent animate-pulse shrink-0" />
      <SeverityBadge severity={toast.severity} />
      <span className="text-sm text-forge-text max-w-xs">{toast.title}</span>
      <button onClick={dismissToast} className="text-forge-muted hover:text-forge-text text-xs ml-2">
        ✕
      </button>
    </div>
  );
};

export default LiveToast;
