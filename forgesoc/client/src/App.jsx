import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import AlertDetails from './pages/AlertDetails';
import Events from './pages/Events';
import Assets from './pages/Assets';
import DetectionRules from './pages/DetectionRules';
import Incidents from './pages/Incidents';
import Blocklist from './pages/Blocklist';
import ThreatMap from './pages/ThreatMap';
import Playbooks from './pages/Playbooks';
import Reports from './pages/Reports';

const TITLES = {
  '/': 'Security Operations Center',
  '/threat-map': 'Threat Map',
  '/alerts': 'Alert Management',
  '/incidents': 'Incidents',
  '/events': 'Events / Logs',
  '/blocklist': 'Real-Time IP Blocklist',
  '/playbooks': 'Automated Response Playbooks',
  '/assets': 'Assets',
  '/rules': 'Detection Rules',
  '/reports': 'Reports',
};

const TitledLayout = () => {
  const location = useLocation();
  const base = '/' + (location.pathname.split('/')[1] || '');
  const title = TITLES[base] || (base === '/alerts' ? 'Alert Investigation' : 'ForgeSOC');
  return <Layout title={title} />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <TitledLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/threat-map" element={<ThreatMap />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/alerts/:id" element={<AlertDetails />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/events" element={<Events />} />
        <Route path="/blocklist" element={<Blocklist />} />
        <Route path="/playbooks" element={<Playbooks />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/rules" element={<DetectionRules />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default App;
