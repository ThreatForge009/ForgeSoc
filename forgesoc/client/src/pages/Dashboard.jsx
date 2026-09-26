import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';
import AlertTable from '../components/AlertTable';

const SEVERITY_COLORS = {
  CRITICAL: '#FF4D5E',
  HIGH: '#FF9F43',
  MEDIUM: '#F5D547',
  LOW: '#4C9EF1',
  INFO: '#5A7185',
};

const Dashboard = () => {
  const [alertStats, setAlertStats] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [blockedCount, setBlockedCount] = useState(null);
  const [incidentCount, setIncidentCount] = useState(null);

  useEffect(() => {
    api.get('/alerts/stats/summary').then((res) => setAlertStats(res.data));
    api.get('/events/stats/summary').then((res) => setEventStats(res.data));
    api.get('/alerts?limit=6').then((res) => setRecentAlerts(res.data.alerts));
    api.get('/blocklist', { params: { active: true } }).then((res) => setBlockedCount(res.data.length));
    api.get('/incidents').then((res) => setIncidentCount(res.data.length));
  }, []);

  const criticalCount =
    alertStats?.bySeverity?.find((s) => s._id === 'CRITICAL')?.count || 0;

  const severityData =
    alertStats?.bySeverity?.map((s) => ({ name: s._id, value: s.count })) || [];

  const eventTypeData =
    eventStats?.byType?.map((e) => ({ name: e._id, count: e.count })) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <StatCard label="TOTAL EVENTS" value={eventStats?.total ?? '—'} sub={`${eventStats?.last24h ?? 0} in last 24h`} />
        <StatCard label="TOTAL ALERTS" value={alertStats?.total ?? '—'} sub={`${alertStats?.open ?? 0} open`} />
        <StatCard label="CRITICAL" value={String(criticalCount).padStart(2, '0')} accent={criticalCount > 0} />
        <StatCard label="INCIDENTS" value={incidentCount ?? '—'} sub="correlated attack chains" />
        <StatCard label="IPS BLOCKED" value={blockedCount ?? '—'} sub="active, real-time" accent={blockedCount > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <h3 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-4">
            Alerts by Severity
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#5A7185'} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0F1620', border: '1px solid #1E2A36', fontSize: 12 }}
                labelStyle={{ color: '#C9D6E3' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {severityData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs font-mono text-forge-muted">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[s.name] || '#5A7185' }}
                />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-4">
            Events by Type
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eventTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A36" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#5A7185', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#1E2A36' }} tickLine={false} />
              <YAxis tick={{ fill: '#5A7185', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F1620', border: '1px solid #1E2A36', fontSize: 12 }}
                labelStyle={{ color: '#C9D6E3' }}
                cursor={{ fill: 'rgba(63,224,197,0.05)' }}
              />
              <Bar dataKey="count" fill="#3FE0C5" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="font-mono text-xs text-forge-muted uppercase tracking-wider mb-3">
          Recent Alerts
        </h3>
        <AlertTable alerts={recentAlerts} />
      </div>
    </div>
  );
};

export default Dashboard;
