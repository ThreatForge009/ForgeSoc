import { useEffect, useState } from 'react';
import api from '../services/api';
import EventTable from '../components/EventTable';

const EVENT_TYPES = ['AUTH', 'NETWORK', 'PROCESS', 'FILE', 'SYSTEM', 'PRIVILEGE'];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [eventType, setEventType] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEvents = (targetPage = page) => {
    setLoading(true);
    const params = { page: targetPage, limit: 50 };
    if (eventType) params.eventType = eventType;
    if (q) params.q = q;
    api
      .get('/events', { params })
      .then((res) => {
        setEvents(res.data.events);
        setTotal(res.data.total);
        setPages(res.data.pages);
        setPage(res.data.page);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType]);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-mono text-lg text-forge-text">
        Events <span className="text-forge-muted text-sm">({total.toLocaleString()})</span>
      </h2>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchEvents(1)}
          placeholder="Search event ID, host, IP, action..."
          className="bg-forge-panel border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text w-72 focus:border-forge-accent outline-none font-mono"
        />
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="bg-forge-panel border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none font-mono"
        >
          <option value="">All Types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchEvents(1)}
          className="bg-forge-accent/15 border border-forge-accent/40 text-forge-accent font-mono text-sm px-4 py-2 rounded-sm hover:bg-forge-accent/25 transition-colors"
        >
          SEARCH
        </button>
      </div>

      {loading ? (
        <div className="panel p-10 text-center text-forge-muted font-mono text-sm">Loading...</div>
      ) : (
        <>
          <EventTable events={events} />
          <div className="flex items-center justify-between font-mono text-xs text-forge-muted">
            <span>
              Page {page} of {pages || 1}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchEvents(page - 1)}
                className="border border-forge-border rounded-sm px-3 py-1.5 disabled:opacity-30 hover:border-forge-accent hover:text-forge-accent transition-colors"
              >
                PREV
              </button>
              <button
                disabled={page >= pages}
                onClick={() => fetchEvents(page + 1)}
                className="border border-forge-border rounded-sm px-3 py-1.5 disabled:opacity-30 hover:border-forge-accent hover:text-forge-accent transition-colors"
              >
                NEXT
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Events;
